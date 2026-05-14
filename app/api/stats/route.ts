import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

export const GET = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: user.userId } },
      },
      include: {
        tasks: true,
        members: true,
      },
    });

    const totalProjects = projects.length;
    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const completedTasks = projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === "DONE").length,
      0
    );
    const inProgressTasks = projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
      0
    );
    const todoTasks = projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === "TODO").length,
      0
    );

    const tasksByPriority = {
      HIGH: projects.reduce(
        (acc, p) => acc + p.tasks.filter((t) => t.priority === "HIGH").length,
        0
      ),
      MEDIUM: projects.reduce(
        (acc, p) => acc + p.tasks.filter((t) => t.priority === "MEDIUM").length,
        0
      ),
      LOW: projects.reduce(
        (acc, p) => acc + p.tasks.filter((t) => t.priority === "LOW").length,
        0
      ),
    };

    const projectStats = projects.map((p) => ({
      name: p.name,
      total: p.tasks.length,
      completed: p.tasks.filter((t) => t.status === "DONE").length,
      inProgress: p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
      todo: p.tasks.filter((t) => t.status === "TODO").length,
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Stats fetched successfully",
      data: {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        tasksByPriority,
        projectStats,
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});