/**
 * app/api/classes/[classId]/route.ts
 *
 * GET    /api/classes/[classId]  — Get section details
 * PATCH  /api/classes/[classId]  — Faculty: Update or archive section
 * DELETE /api/classes/[classId]  — Faculty: Delete section
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { updateClassSchema } from "@/lib/validations/class";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Access Guard Helper ──────────────────────────────────────────────────────

async function verifyClassAccess(
  classId: string,
  profileId: string,
  role: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;

  if (role === "FACULTY") {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { facultyId: true },
    });
    return cls?.facultyId === profileId;
  }

  if (role === "STUDENT") {
    const membership = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId, studentId: profileId } },
    });
    return !!membership;
  }

  return false;
}

// ─── GET /api/classes/[classId] ───────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { classId: string } },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return errorResponse(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.status,
      );

    const { profile } = session;
    const { classId } = params;

    const hasAccess = await verifyClassAccess(
      classId,
      profile.id,
      profile.role,
    );
    if (!hasAccess)
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        faculty: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
                department: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { posts: true, members: true } },
      },
    });

    if (!cls)
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    return successResponse(cls);
  } catch (error) {
    console.error("[GET /api/classes/[classId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/classes/[classId] ─────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { classId: string } },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return errorResponse(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.status,
      );

    const { profile } = session;
    const { classId } = params;

    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { facultyId: true },
    });
    if (!cls)
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (cls.facultyId !== profile.id)
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const body = await request.json();
    const parsed = updateClassSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0].message,
        ERRORS.VALIDATION.status,
      );
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: parsed.data,
      include: {
        faculty: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        _count: { select: { members: true, posts: true } },
      },
    });

    return successResponse(updated, "Section updated successfully.");
  } catch (error) {
    console.error("[PATCH /api/classes/[classId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── DELETE /api/classes/[classId] ────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { classId: string } },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return errorResponse(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.status,
      );

    const { profile } = session;
    const { classId } = params;

    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { facultyId: true },
    });
    if (!cls)
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (cls.facultyId !== profile.id)
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    // Gather all physical files associated with this class
    const postsInClass = await prisma.post.findMany({
      where: { classId },
      select: {
        files: { select: { fileUrl: true } },
        submissions: { select: { fileUrl: true } },
      },
    });
    const classMaterials = await prisma.classMaterial.findMany({
      where: { classId },
      select: { fileKey: true },
    });

    const supabase = createClient();

    // Extract PostFile paths
    const postFilePaths = postsInClass
      .flatMap((p) => p.files)
      .filter((f) => f.fileUrl)
      .map((f) => f.fileUrl.split("post_files/")[1])
      .filter(Boolean);

    // Extract Submission file paths
    const submissionFilePaths = postsInClass
      .flatMap((p) => p.submissions)
      .filter((s) => s.fileUrl)
      .map((s) => s.fileUrl!.split("submissions/")[1])
      .filter(Boolean);

    // Batch Delete from Supabase
    if (postFilePaths.length > 0) {
      const { error } = await supabase.storage
        .from("post_files")
        .remove(postFilePaths);
      if (error)
        console.error(
          "[DELETE /api/classes/[classId]] Storage delete (post_files) failed:",
          error,
        );
    }
    if (submissionFilePaths.length > 0) {
      const { error } = await supabase.storage
        .from("submissions")
        .remove(submissionFilePaths);
      if (error)
        console.error(
          "[DELETE /api/classes/[classId]] Storage delete (submissions) failed:",
          error,
        );
    }
    if (classMaterials.length > 0) {
      const { error } = await supabase.storage
        .from("post-files")
        .remove(classMaterials.map((f) => f.fileKey));
      if (error)
        console.error(
          "[DELETE /api/classes/[classId]] Storage delete (course materials) failed:",
          error,
        );
    }

    // Cascade deletes all related DB records
    await prisma.class.delete({ where: { id: classId } });

    return successResponse(null, "Section deleted successfully.");
  } catch (error) {
    console.error("[DELETE /api/classes/[classId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
