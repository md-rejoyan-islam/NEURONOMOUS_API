import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import secret from "../app/secret";
import { logger } from "../utils/logger";

let io: Server | null = null;

// type AuthPayload = {
//   _id: string;
//   role: string;
//   loginCode?: string;
// };

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: secret.client_url,
      credentials: true,
    },
  });

  // Optional auth: if token provided, attach user and join rooms; otherwise allow limited connection
  // io.use((socket, next) => {
  //   try {
  //     const token = (socket.handshake.auth as { token?: string } | undefined)
  //       ?.token;
  //     if (token) {
  //       const payload = verifyToken(
  //         token,
  //         secret.jwt.accessTokenSecret
  //       ) as unknown as AuthPayload;
  //       (socket.data as any).userId = payload._id;
  //       (socket.data as any).role = payload.role;
  //       (socket.data as any).loginCode = payload.loginCode;
  //       socket.join(`user:${payload._id}`);
  //       if (payload.role === "superadmin") {
  //         socket.join("role:superadmin");
  //       }
  //     }
  //     return next();
  //   } catch (err) {
  //     // proceed unauthenticated
  //     return next();
  //   }
  // });

  io.on("connection", (socket: Socket) => {
    // const data: any = socket.data || {};
    // logger.info(
    //   `Socket connected: ${socket.id}${data.userId ? ` (user: ${data.userId}, role: ${data.role})` : ""}`
    // );

    // Join room for this socket when login
    socket.on("auth:login", (payload: { userId: string }) => {
      console.log(socket.id, "auth:login", payload);

      try {
        if (!payload?.userId) return;
        socket.join(`user:${payload.userId}`);
        logger.info(
          `Socket ${socket.id} joined user room: user:${payload.userId}`
        );
      } catch (err) {
        logger.error("Error during auth:login", err);
      }
    });

    // // Optional identify from client after HTTP-authenticated profile fetch
    // socket.on(
    //   "client:identify",
    //   (payload: { userId: string; role?: string; loginCode?: string }) => {
    //     try {
    //       if (!payload?.userId) return;
    //       (socket.data as any).userId = payload.userId;
    //       if (payload.role) (socket.data as any).role = payload.role;
    //       if (payload.loginCode)
    //         (socket.data as any).loginCode = payload.loginCode;
    //       socket.join(`user:${payload.userId}`);
    //       if (payload.role === "superadmin") socket.join("role:superadmin");
    //     } catch {
    //       console.log("Error during client identification");
    //     }
    //   }
    // );

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// Broadcast helpers
export const emitDeviceStatusUpdate = (payload: { id: string }) => {
  io?.emit(`device:${payload.id}:status`, payload);
  io?.emit(`device:status`, payload);
};

export const emitNoticeEvent = (payload: { id?: string; message: string }) => {
  io?.to("role:superadmin").emit("notice:event", payload);
  io?.emit("admin:notify", { type: "notice", ...payload });
};

export const emitUserLogin = (userId: string) => {
  io?.to("role:superadmin").emit("user:login", { userId, time: Date.now() });
  io?.emit("admin:notify", { type: "user_login", userId, time: Date.now() });
};

export const emitPasswordChanged = (userId: string) => {
  // Notify the affected user and superadmin
  io?.to(`user:${userId}`).emit("auth:password-changed", { time: Date.now() });
  io?.to("role:superadmin").emit("user:password-changed", {
    userId,
    time: Date.now(),
  });
  io?.emit("admin:notify", {
    type: "password_changed",
    userId,
    time: Date.now(),
  });
};

export const emitInvalidateOtherSessions = (userId: string) => {
  if (!io) return;
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  let targeted = false;
  if (room) {
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) continue;
      socket.emit("session:invalidate", { reason: "new_login" });
      targeted = true;
    }
  }
  // Fallback broadcast, clients will self-check user
  if (!targeted) {
    io.emit("session:invalidate-broadcast", { userId });
  }
};
