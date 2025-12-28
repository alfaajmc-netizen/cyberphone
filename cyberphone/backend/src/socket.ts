import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

/**
 * Map from userId => set of socketIds
 */
const userSockets = new Map<string, Set<string>>();

function addUserSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId) ?? new Set<string>();
  set.add(socketId);
  userSockets.set(userId, set);
}
function removeUserSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
  else userSockets.set(userId, set);
}

export function sendEventToUser(io: Server, userId: string, event: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, payload);
  }
}

export function handleSocket(io: Server) {
  // Redis subscriber for cross-process notifications (already present)
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const sub = new IORedis(redisUrl);
  sub.subscribe("notifications", (err, count) => {
    if (err) console.error("Redis subscribe error:", err);
    else console.log("Subscribed to notifications channel. count=", count);
  });
  sub.on("message", (_channel, message) => {
    try {
      const payload = JSON.parse(message);
      const userId = payload.userId;
      if (userId) {
        sendEventToUser(io, userId, "notification", payload);
      } else {
        console.warn("Notification message without userId:", payload);
      }
    } catch (err) {
      console.error("Failed to parse notification message:", err, message);
    }
  });

  // auth middleware for sockets
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      const err = new Error("Authentication error: no token provided");
      // @ts-ignore
      err["data"] = { reason: "no_token" };
      return next(err);
    }
    try {
      const payload: any = jwt.verify(String(token), JWT_SECRET);
      socket.data.userId = payload.sub;
      return next();
    } catch (err) {
      const error = new Error("Authentication error: invalid token");
      // @ts-ignore
      error["data"] = { reason: "invalid_token" };
      return next(error);
    }
  });

  io.on("connection", (socket: Socket) => {
    const socketId = socket.id;
    const userId = socket.data.userId as string | undefined;
    console.log("socket connected", socketId, "userId=", userId);

    if (userId) addUserSocket(userId, socketId);

    // Chat and live join existing handlers...
    socket.on("chat:message", (payload) => {
      const { room, message } = payload || {};
      const fromUser = socket.data.userId || socket.id;
      if (room) io.to(room).emit("chat:message", { from: fromUser, message });
      else socket.broadcast.emit("chat:message", { from: fromUser, message });
    });

    socket.on("live:join", ({ liveId }: { liveId: string }) => {
      socket.join(`live:${liveId}`);
      const fromUser = socket.data.userId || null;
      io.to(`live:${liveId}`).emit("live:viewer:join", { userId: fromUser, socketId });
      console.log(`socket ${socketId} joined live:${liveId}`);
    });

    socket.on("live:host:join", ({ liveId }: { liveId: string }) => {
      socket.join(`live:${liveId}`);
      const fromUser = socket.data.userId || null;
      io.to(`live:${liveId}`).emit("live:host:ready", { hostSocketId: socketId, userId: fromUser });
      console.log(`socket ${socketId} joined live:${liveId} as host`);
    });

    // ----------------------
    // NEW: raise hand flow
    // Viewer emits 'raise-hand' with { liveId }
    socket.on("raise-hand", async ({ liveId }: { liveId: string }) => {
      try {
        const uid = socket.data.userId as string | undefined;
        if (!uid) return;
        const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, username: true, name: true } });
        const payload = { userId: uid, socketId, username: user?.username || user?.name || "Anónimo" };
        // Notify the room (host and other viewers can listen if desired)
        io.to(`live:${liveId}`).emit("live:hand:raised", payload);
        console.log(`User ${uid} raised hand in live ${liveId}`);
      } catch (err) {
        console.error("raise-hand error", err);
      }
    });

    // Host approves a speak request: { toSocketId, liveId }
    socket.on("host:approve-speak", async ({ toSocketId, liveId }: { toSocketId: string; liveId: string }) => {
      try {
        const uid = socket.data.userId as string | undefined;
        if (!uid) return;
        // validate that the requester is host of the live
        const live = await prisma.live.findUnique({ where: { id: liveId } });
        if (!live) return console.warn("live not found", liveId);
        if (live.hostId !== uid) return console.warn("user not host, ignoring approve-speak");
        // forward permission to the target socket (viewer)
        io.to(toSocketId).emit("permission:granted", { liveId, hostSocketId: socketId });
        // notify room that this viewer was approved (optional)
        io.to(`live:${liveId}`).emit("live:hand:approved", { socketId: toSocketId });
        console.log(`Host ${uid} approved speak for socket ${toSocketId} in live ${liveId}`);
      } catch (err) {
        console.error("host:approve-speak error", err);
      }
    });

    // Host can dismiss: { toSocketId, liveId }
    socket.on("host:dismiss-hand", ({ toSocketId, liveId }: { toSocketId: string; liveId: string }) => {
      io.to(`live:${liveId}`).emit("live:hand:dismissed", { socketId: toSocketId });
      console.log(`Host dismissed hand ${toSocketId} in live ${liveId}`);
    });

    // ----------------------
    // WebRTC signaling (offer/answer/ice) - forwards based on 'to'
    socket.on("webrtc:offer", ({ to, offer }: { to: string; offer: any }) => {
      const from = socketId;
      if (!to) return;
      io.to(to).emit("webrtc:offer", { from, offer });
    });

    socket.on("webrtc:answer", ({ to, answer }: { to: string; answer: any }) => {
      const from = socketId;
      if (!to) return;
      io.to(to).emit("webrtc:answer", { from, answer });
    });

    socket.on("webrtc:ice", ({ to, candidate }: { to: string; candidate: any }) => {
      const from = socketId;
      if (!to) return;
      io.to(to).emit("webrtc:ice", { from, candidate });
    });

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected", socketId, "reason=", reason);
      if (userId) removeUserSocket(userId, socketId);
    });
  });
}

export { userSockets, addUserSocket, removeUserSocket };