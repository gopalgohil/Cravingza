import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ [Socket.io] Client connected: ${socket.id}`);

    socket.on("join_room", (roomName) => {
      socket.join(roomName);
      console.log(`👥 [Socket.io] Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on("leave_room", (roomName) => {
      socket.leave(roomName);
      console.log(`🚪 [Socket.io] Socket ${socket.id} left room: ${roomName}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [Socket.io] Client disconnected (${socket.id}): ${reason}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("⚠️ [Socket.io] io instance requested before initialization");
  }
  return io;
};

export const emitOrderUpdate = (orderData) => {
  if (io) {
    const orderId = orderData._id || orderData.id;
    console.log(`📢 [Socket.io] Broadcasting order_status_updated for Order: ${orderId}, Status: ${orderData.status}`);
    io.emit("order_status_updated", orderData);
    io.emit("new_order_placed", orderData);
  }
};
