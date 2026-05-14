import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Name, email and password are required",
      }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "User already exists",
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "User created successfully",
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
}