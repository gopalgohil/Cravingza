import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket && typeof window !== "undefined") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiUrl.replace(/\/api$/, "");

    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("⚡ [Next.js Web App] Socket.io connected! ID:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 [Next.js Web App] Socket.io disconnected:", reason);
    });
  }
  return socket as Socket;
};

export const subscribeToWebOrderUpdates = (callback: (data: any) => void) => {
  const s = getSocket();
  if (s) {
    s.on("order_status_updated", callback);
    s.on("new_order_placed", callback);
  }

  return () => {
    if (s) {
      s.off("order_status_updated", callback);
      s.off("new_order_placed", callback);
    }
  };
};
