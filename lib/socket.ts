import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a project room
    socket.on("join-project", (projectId: string) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project ${projectId}`);
    });

    // Leave a project room
    socket.on("leave-project", (projectId: string) => {
      socket.leave(projectId);
      console.log(`Socket ${socket.id} left project ${projectId}`);
    });

    // Handle task updates
    socket.on("task-updated", (data: { projectId: string; task: unknown }) => {
      socket.to(data.projectId).emit("task-updated", data.task);
    });

    // Handle new task
    socket.on("task-created", (data: { projectId: string; task: unknown }) => {
      socket.to(data.projectId).emit("task-created", data.task);
    });

    // Handle task deleted
    socket.on("task-deleted", (data: { projectId: string; taskId: string }) => {
      socket.to(data.projectId).emit("task-deleted", data.taskId);
    });

    // Handle new comment
    socket.on("comment-added", (data: { projectId: string; comment: unknown }) => {
      socket.to(data.projectId).emit("comment-added", data.comment);
    });

    // Online presence
    socket.on("user-online", (data: { projectId: string; userId: string; name: string }) => {
      socket.to(data.projectId).emit("user-online", { userId: data.userId, name: data.name });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
