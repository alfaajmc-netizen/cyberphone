import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { createSocket } from "../lib/socket";

type NotificationItem = {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  createdAt: string;
  message?: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/notifications");
        if (!mounted) return;
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    })();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;
    const socket = createSocket(token);
    socket.on("connect", () => console.log("notification socket connected", socket.id));
    socket.on("notification", (payload: any) => {
      // prepend to list
      setNotifications((prev) => [{ ...payload, id: payload.mediaId || payload.id || Math.random().toString(36).slice(2), read: false, createdAt: payload.timestamp || new Date().toISOString(), message: payload.message || "" }, ...prev]);
    });

    socket.on("connect_error", (err: any) => {
      console.warn("Socket connect_error:", err);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error("markRead error", err);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative px-3 py-1 rounded hover:bg-gray-100">
        🔔
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="p-2 border-b font-semibold">Notificações</div>
          <div className="max-h-64 overflow-auto">
            {notifications.length === 0 && <div className="p-3 text-sm text-gray-600">Sem notificações</div>}
            {notifications.map((n) => (
              <div key={n.id} className={`p-3 hover:bg-gray-50 flex justify-between items-start ${n.read ? "" : "bg-gray-50"}`}>
                <div>
                  <div className="text-sm">{n.message || (n.type === "media:processed" ? "Vídeo processado" : n.type)}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="ml-2 flex flex-col items-end">
                  {!n.read && <button onClick={() => markRead(n.id)} className="text-xs text-blue-600">Marcar lido</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}