import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ApiResponse, JwtPayload } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Email and password are required",
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Invalid credentials",
      }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Invalid credentials",
      }, { status: 401 });
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
}