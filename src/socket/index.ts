import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import secret from "../app/secret";
import { logger } from "../utils/logger";

let io: Server | null = null;

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: secret.client_url,
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
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

export const emitInvalidateOtherSessions = (userId: string) => {
  if (!io) return;
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  console.log(`Emitting invalidate sessions for user: ${userId}`, room);

  let targeted = false;
  if (room) {
    for (const socketId of room) {
      console.log("Targeting socket for invalidation:", socketId);

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

// not used

// const emitNoticeEvent = (payload: { id?: string; message: string }) => {
//   io?.to("role:superadmin").emit("notice:event", payload);
//   io?.emit("admin:notify", { type: "notice", ...payload });
// };

// const emitUserLogin = (userId: string) => {
//   io?.to("role:superadmin").emit("user:login", { userId, time: Date.now() });
//   io?.emit("admin:notify", { type: "user_login", userId, time: Date.now() });
// };

// const emitPasswordChanged = (userId: string) => {
//   // Notify the affected user and superadmin
//   io?.to(`user:${userId}`).emit("auth:password-changed", { time: Date.now() });
//   io?.to("role:superadmin").emit("user:password-changed", {
//     userId,
//     time: Date.now(),
//   });
//   io?.emit("admin:notify", {
//     type: "password_changed",
//     userId,
//     time: Date.now(),
//   });
// };
