"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FolderKanban, CheckCircle, Clock, Circle } from "lucide-react";

interface Stats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  tasksByPriority: { HIGH: number; MEDIUM: number; LOW: number };
  projectStats: { name: string; total: number; completed: number; inProgress: number; todo: number }[];
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FolderKanban size={20} />} label="Total Projects" value={stats?.totalProjects ?? 0} color="blue" />
        <StatCard icon={<Circle size={20} />} label="Todo" value={stats?.todoTasks ?? 0} color="gray" />
        <StatCard icon={<Clock size={20} />} label="In Progress" value={stats?.inProgressTasks ?? 0} color="yellow" />
        <StatCard icon={<CheckCircle size={20} />} label="Completed" value={stats?.completedTasks ?? 0} color="green" />
      </div>

      {/* Chart */}
      {stats && stats.projectStats.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.projectStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#F9FAFB" }}
              />
              <Bar dataKey="todo" name="Todo" fill="#6B7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inProgress" name="In Progress" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!stats || stats.totalProjects === 0 && (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <FolderKanban size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No projects yet. Create your first project to see analytics.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "gray" | "yellow" | "green";
}) {
  const colors = {
    blue: "text-blue-400 bg-blue-400/10",
    gray: "text-gray-400 bg-gray-400/10",
    yellow: "text-yellow-400 bg-yellow-400/10",
    green: "text-green-400 bg-green-400/10",
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}