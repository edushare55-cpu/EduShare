/**
 * app/api/classes/route.ts
 *
 * GET  /api/classes  — Fetch sections for the authenticated user (role-scoped)
 * POST /api/classes  — Faculty only: Create a new section
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createClassSchema } from "@/lib/validations/class";
import { generateSectionCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── GET /api/classes ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    let classes;

    if (profile.role === "FACULTY") {
      classes = await prisma.class.findMany({
        where: { facultyId: profile.id },
        include: {
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (profile.role === "STUDENT") {
      const memberships = await prisma.classMembership.findMany({
        where: { studentId: profile.id },
        include: {
          class: {
            include: {
              faculty: { select: { id: true, name: true, avatarUrl: true } },
              _count: { select: { members: true, posts: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      classes = memberships.map((m) => ({ ...m.class, joinedAt: m.joinedAt }));
    } else if (profile.role === "ADMIN") {
      classes = await prisma.class.findMany({
        include: {
          faculty: { select: { id: true, name: true, avatarUrl: true, email: true } },
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    return successResponse(classes);
  } catch (error) {
    console.error("[GET /api/classes]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/classes ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    if (profile.role !== "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { name, subject, description, facultyId } = parsed.data;

    // Generate a unique class code
    let classCode: string;
    let attempts = 0;
    do {
      classCode = generateSectionCode();
      const existing = await prisma.class.findUnique({ where: { classCode } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/join/${classCode}`;

    const newClass = await prisma.class.create({
      data: {
        name,
        subject,
        description: description ?? null,
        classCode,
        inviteLink,
        facultyId: facultyId,
      },
      include: {
        faculty: { select: { id: true, name: true, avatarUrl: true, email: true } },
        _count: { select: { members: true, posts: true } },
      },
    });

    return successResponse(newClass, "Section created successfully.", 201);
  } catch (error) {
    console.error("[POST /api/classes]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
