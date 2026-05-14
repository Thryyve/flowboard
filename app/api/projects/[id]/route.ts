import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

// GET single project
export const GET = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const id = req.url.split("/").pop();

    const project = await prisma.project.findFirst({
      where: {
        id,
        members: { some: { userId: user.userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            comments: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Project not found",
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Project fetched successfully",
      data: project,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// PATCH update project
export const PATCH = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const id = req.url.split("/").pop();
    const { name, description } = await req.json();

    const member = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: user.userId, role: "ADMIN" },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Only project admins can update the project",
      }, { status: 403 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// DELETE project
export const DELETE = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const id = req.url.split("/").pop();

    const member = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: user.userId, role: "ADMIN" },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Only project admins can delete the project",
      }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});