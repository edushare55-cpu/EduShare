/**
 * app/api/posts/[postId]/comments/route.ts
 *
 * GET  /api/posts/[postId]/comments  — Fetch all comments for a post
 * POST /api/posts/[postId]/comments  — Add a comment (Student or Faculty)
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createCommentSchema } from "@/lib/validations/post";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── Access Helper ────────────────────────────────────────────────────────────

async function verifyClassAccess(classId: string, profileId: string, role: string): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role === "FACULTY") {
    const cls = await prisma.class.findUnique({ where: { id: classId }, select: { facultyId: true } });
    return cls?.facultyId === profileId;
  }
  if (role === "STUDENT") {
    const m = await prisma.classMembership.findUnique({
      where: { classId_studentId: { classId, studentId: profileId } },
    });
    return !!m;
  }
  return false;
}

// ─── GET /api/posts/[postId]/comments ─────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { postId } = params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { classId: true },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    const hasAccess = await verifyClassAccess(post.classId, profile.id, profile.role);
    if (!hasAccess) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(comments);
  } catch (error) {
    console.error("[GET /api/posts/[postId]/comments]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/posts/[postId]/comments ────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { postId } = params;

    // Admins cannot comment
    if (profile.role === "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { classId: true, authorId: true, author: { select: { role: true } } },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    const hasAccess = await verifyClassAccess(post.classId, profile.id, profile.role);
    if (!hasAccess) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: profile.id,
        content: parsed.data.content,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // Notify the post author (only if commenter is different)
    if (profile.id !== post.authorId) {
      try {
        await createNotification({
          userId:      post.authorId,
          type:        "NEW_COMMENT",
          message:     `${profile.name} commented on your post.`,
          referenceId: postId,
          link:        `/${post.author.role === "FACULTY" ? "faculty" : "student"}/classes/${post.classId}/feed`,
        });
      } catch (notifError) {
        console.warn("[POST /api/posts/[postId]/comments] Notification failed:", notifError);
      }
    }

    return successResponse(comment, "Comment added.", 201);
  } catch (error) {
    console.error("[POST /api/posts/[postId]/comments]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
