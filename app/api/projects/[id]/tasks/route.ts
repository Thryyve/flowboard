import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

// GET all tasks for a project
export const GET = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const projectId = req.url.split("/projects/")[1].split("/tasks")[0];

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.userId },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "You are not a member of this project",
      }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// POST create a task
export const POST = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const projectId = req.url.split("/projects/")[1].split("/tasks")[0];
    const { title, description, status, priority, dueDate, assignedTo } = await req.json();

    if (!title) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Task title is required",
      }, { status: 400 });
    }

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.userId },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "You are not a member of this project",
      }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedTo: assignedTo || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Task created successfully",
      data: task,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});