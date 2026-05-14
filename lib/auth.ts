import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { JwtPayload } from "@/types";

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function withAuth(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = getTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

export function withRole(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>,
  allowedRoles: string[]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = getTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden - insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}