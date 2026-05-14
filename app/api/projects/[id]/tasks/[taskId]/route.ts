import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

// PATCH update a task
export const PATCH = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const parts = req.url.split("/");
    const taskId = parts.pop();
    const projectId = parts[parts.indexOf("projects") + 1];

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.userId },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "You are not a member of this project",
      }, { status: 403 });
    }

    const { title, description, status, priority, dueDate, assignedTo } = await req.json();

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// DELETE a task
export const DELETE = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const parts = req.url.split("/");
    const taskId = parts.pop();
    const projectId = parts[parts.indexOf("projects") + 1];

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.userId },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "You are not a member of this project",
      }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});