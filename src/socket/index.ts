import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import secret from "../app/secret";
import { logger } from "../utils/logger";

let io: Server | null = null;

const activeSessions = new Map<string, string>(); // userId -> Set of socketId

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: secret.client_url,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;

    // update active sessions
    if (userId) {
      activeSessions.set(userId, socket.id);
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    console.log("active sessions", activeSessions);

    // Join room for this socket when login
    socket.on("auth:login", (payload: { userId: string }) => {
      console.log(socket.id, "auth:login", payload);

      try {
        if (!payload?.userId) return;

        // force disconnect previous session
        const existingSocketId = activeSessions.get(payload.userId);
        console.log("existingSocketId", existingSocketId, socket.id);

        if (existingSocketId && existingSocketId !== socket.id) {
          console.log("Disconnecting previous socket", existingSocketId);

          const existingSocket = io?.sockets.sockets.get(existingSocketId);
          if (existingSocket) {
            existingSocket.emit("session:invalidate", { reason: "new_login" });
            existingSocket.disconnect(true);
            logger.info(
              `Disconnected previous socket ${existingSocketId} for user ${payload.userId}`
            );
          }
        }

        // add to active sessions
        activeSessions.set(payload.userId, socket.id);
        socket.broadcast.emit(
          "active-users",
          Array.from(activeSessions.keys())
        );

        // // if user with same id not added to room again

        // const rooms = socket.rooms;
        // console.log(rooms);

        // if (rooms.has(`user:${payload.userId}`)) return;

        // socket.join(`user:${payload.userId}`);
        logger.info(
          `Socket ${socket.id} joined user room: user:${payload.userId}`
        );
      } catch (err) {
        logger.error("Error during auth:login", err);
      }
    });

    socket.on("active-users", (_, callback) => {
      const sessions = Array.from(activeSessions.keys());
      callback(sessions);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
      // Remove from active sessions
      for (const [userId, socketId] of activeSessions.entries()) {
        if (socketId === socket.id) {
          activeSessions.delete(userId);
          break;
        }
      }
      socket.broadcast.emit("active-users", Array.from(activeSessions.keys()));
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
  console.log("Emitting device status update", payload);

  io?.emit(`device:${payload.id}:status`, payload);
  io?.emit(`device:status`, payload);
};

export const emitDeviceFirmwareUpdate = (payload: {
  id: string;
  status: string;
}) => {
  // console.log("Emitting firmware update", payload);

  io?.emit(`device:${payload.id}:firmware`, payload);
};

// export const emitInvalidateOtherSessions = (userId: string) => {
//   if (!io) return;
//   const room = io.sockets.adapter.rooms.get(`user:${userId}`);
//   console.log(`Emitting invalidate sessions for user: ${userId}`, room);

//   let targeted = false;
//   if (room) {
//     for (const socketId of room) {
//       console.log("Targeting socket for invalidation:", socketId);

//       const socket = io.sockets.sockets.get(socketId);

//       if (!socket) continue;
//       socket.emit("session:invalidate", { reason: "new_login" });
//       targeted = true;
//     }
//   }
//   // Fallback broadcast, clients will self-check user
//   if (!targeted) {
//     io.emit("session:invalidate-broadcast", { userId });
//   }
// };

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
