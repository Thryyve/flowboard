import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { ApiResponse, JwtPayload } from "@/types";

// GET all projects for the logged in user
export const GET = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: user.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});

// POST create a new project
export const POST = withAuth(async (req: NextRequest, user: JwtPayload) => {
  try {
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Project name is required",
      }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: user.userId,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Project created successfully",
      data: project,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
});