import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

// POST add a member to a project
export const POST = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const projectId = req.url.split("/projects/")[1].split("/members")[0];
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Email is required",
      }, { status: 400 });
    }

    // Check if requester is admin
    const requesterMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.userId, role: "ADMIN" },
    });

    if (!requesterMember) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Only project admins can add members",
      }, { status: 403 });
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "No user found with that email",
      }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: invitedUser.id },
    });

    if (existingMember) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "User is already a member of this project",
      }, { status: 400 });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: invitedUser.id,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Member added successfully",
      data: member,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// DELETE remove a member from a project
export const DELETE = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const projectId = req.url.split("/projects/")[1].split("/members")[0];
    const { userId } = await req.json();

    const requesterMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.userId, role: "ADMIN" },
    });

    if (!requesterMember) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Only project admins can remove members",
      }, { status: 403 });
    }

    await prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});