import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    }
    socketRef.current = socket;

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  return socketRef.current;
}

export function joinProject(projectId: string) {
  if (socket) socket.emit("join-project", projectId);
}

export function leaveProject(projectId: string) {
  if (socket) socket.emit("leave-project", projectId);
}

export function emitTaskUpdated(projectId: string, task: unknown) {
  if (socket) socket.emit("task-updated", { projectId, task });
}

export function emitTaskCreated(projectId: string, task: unknown) {
  if (socket) socket.emit("task-created", { projectId, task });
}

export function emitTaskDeleted(projectId: string, taskId: string) {
  if (socket) socket.emit("task-deleted", { projectId, taskId });
}

export function emitCommentAdded(projectId: string, comment: unknown) {
  if (socket) socket.emit("comment-added", { projectId, comment });
}

export function emitUserOnline(projectId: string, userId: string, name: string) {
  if (socket) socket.emit("user-online", { projectId, userId, name });
}