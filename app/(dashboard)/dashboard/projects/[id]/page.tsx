"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { Plus, MessageSquare, User, Calendar } from "lucide-react";
import { emitTaskCreated, emitTaskUpdated, useSocket } from "@/hooks/useSocket";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  comments: { id: string; content: string; user: { name: string } }[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  members: { id: string; role: string; user: { id: string; name: string; email: string } }[];
  tasks: Task[];
}

const STATUS_COLUMNS = ["TODO", "IN_PROGRESS", "DONE"] as const;
const STATUS_LABELS = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const STATUS_COLORS = {
  TODO: "border-gray-600",
  IN_PROGRESS: "border-yellow-500",
  DONE: "border-green-500",
};
const PRIORITY_COLORS = {
  LOW: "bg-gray-700 text-gray-300",
  MEDIUM: "bg-yellow-900 text-yellow-300",
  HIGH: "bg-red-900 text-red-300",
};

export default function ProjectPage() {
  const { token, user } = useAuth();
  const params = useParams();
  const projectId = params.id as string;
  const socket = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchProject();
  }, [token, projectId]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-project", projectId);

    socket.on("task-created", (task: Task) => {
      setProject((prev) =>
        prev ? { ...prev, tasks: [...prev.tasks, task] } : prev
      );
    });

    socket.on("task-updated", (updatedTask: Task) => {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t
              ),
            }
          : prev
      );
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.off("task-created");
      socket.off("task-updated");
    };
  }, [socket, projectId]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask() {
    if (!taskTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          status: selectedStatus,
          priority: taskPriority,
          assignedTo: taskAssignee || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        emitTaskCreated(projectId, data.data);
        setProject((prev) =>
          prev ? { ...prev, tasks: [...prev.tasks, data.data] } : prev
        );
        setShowTaskModal(false);
        setTaskTitle("");
        setTaskDescription("");
        setTaskPriority("MEDIUM");
        setTaskAssignee("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        emitTaskUpdated(projectId, data.data);
        setProject((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) =>
                  t.id === taskId ? data.data : t
                ),
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{project.name}</h2>
          {project.description && (
            <p className="text-gray-400 text-sm mt-1">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {STATUS_COLUMNS.map((status) => {
          const columnTasks = project.tasks.filter((t) => t.status === status);
          return (
            <div key={status} className={`bg-gray-900 rounded-2xl border-t-2 ${STATUS_COLORS[status]} p-4 flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">{STATUS_LABELS[status]}</h3>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.assignee && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <User size={12} />
                            <span className="text-xs">{task.assignee.name}</span>
                          </div>
                        )}
                        {(task.comments?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <MessageSquare size={12} />
                            <span className="text-xs">{task.comments.length}</span>
                          </div>
                        )}
                      </div>

                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as "TODO" | "IN_PROGRESS" | "DONE")}
                        className="text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setSelectedStatus(status); setShowTaskModal(true); }}
                className="mt-3 w-full text-xs text-gray-500 hover:text-gray-300 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={12} />
                Add task
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as "TODO" | "IN_PROGRESS" | "DONE")}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign To</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 w-full max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {selectedTask.description && (
              <p className="text-gray-400 text-sm mb-4">{selectedTask.description}</p>
            )}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[selectedTask.priority]}`}>
                {selectedTask.priority}
              </span>
              {selectedTask.assignee && (
                <div className="flex items-center gap-1 text-gray-400">
                  <User size={14} />
                  <span className="text-xs">{selectedTask.assignee.name}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-800 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Comments</h4>
              {selectedTask.comments.length === 0 ? (
                <p className="text-xs text-gray-500">No comments yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTask.comments.map((c) => (
                    <div key={c.id} className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-400 mb-1">{c.user.name}</p>
                      <p className="text-xs text-gray-300">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}