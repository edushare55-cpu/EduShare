/**
 * app/api/classes/join/route.ts
 *
 * POST /api/classes/join — Student only: Join a section via classCode
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { joinClassSchema } from "@/lib/validations/class";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    // Only students can join sections
    if (profile.role !== "STUDENT") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = joinClassSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { classCode } = parsed.data;

    // Find the class by code
    const cls = await prisma.class.findUnique({
      where: { classCode },
      select: {
        id: true,
        name: true,
        subject: true,
        classCode: true,
        inviteLink: true,
        isArchived: true,
        facultyId: true,
        faculty: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    });

    if (!cls) {
      return errorResponse("Section not found. Check your section code.", 404);
    }

    if (cls.isArchived) {
      return errorResponse("This section is no longer active.", 400);
    }

    // Check if already enrolled
    const existingMembership = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId: cls.id, studentId: profile.id } },
    });

    if (existingMembership) {
      return errorResponse("You are already enrolled in this section.", ERRORS.CONFLICT.status);
    }

    // Create the membership
    await prisma.classMembership.create({
      data: { classId: cls.id, studentId: profile.id },
    });

    // Notify the faculty member
    try {
      await createNotification({
        userId:      cls.facultyId,
        type:        "CLASS_JOINED",
        message:     `${profile.name} joined your section "${cls.name}".`,
        referenceId: cls.id,
      });
    } catch (notifError) {
      console.warn("[POST /api/classes/join] Notification failed:", notifError);
    }

    return successResponse(cls, "Successfully joined the section.", 201);
  } catch (error) {
    console.error("[POST /api/classes/join]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
