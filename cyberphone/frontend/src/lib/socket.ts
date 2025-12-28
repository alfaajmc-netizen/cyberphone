import { io, Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Create authenticated socket.io client.
 * - token: JWT string (from localStorage)
 */
export function createSocket(token?: string): Socket {
  // Socket.io will send auth in the initial handshake
  const url = API_BASE.replace(/^http/, "ws");
  const socket = io(url, {
    autoConnect: true,
    transports: ["websocket"],
    auth: {
      token,
    },
  });
  return socket;
}