import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

// GET all comments for a task
export const GET = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const parts = req.url.split("/");
    const taskId = parts[parts.indexOf("tasks") + 1];
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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// POST create a comment
export const POST = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const parts = req.url.split("/");
    const taskId = parts[parts.indexOf("tasks") + 1];
    const projectId = parts[parts.indexOf("projects") + 1];

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Comment content is required",
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

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: user.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Comment created successfully",
      data: comment,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});