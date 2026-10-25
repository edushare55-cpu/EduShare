/**
 * app/api/posts/[postId]/pin/route.ts
 *
 * PATCH /api/posts/[postId]/pin — Faculty only: Toggle pin status
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { postId } = params;

    if (profile.role !== "FACULTY") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { class: { select: { facultyId: true } } },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    if (post.class.facultyId !== profile.id) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const isPinning = !post.isPinned;

    if (isPinning) {
      const pinnedCount = await prisma.post.count({
        where: {
          classId: post.classId,
          isPinned: true,
        },
      });

      if (pinnedCount >= 3) {
        return errorResponse("Maximum of 3 pinned posts allowed. Please unpin a post first.", 400);
      }
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { isPinned: isPinning },
      select: { id: true, isPinned: true },
    });

    return successResponse(
      { isPinned: updated.isPinned },
      `Post ${updated.isPinned ? "pinned" : "unpinned"}.`
    );
  } catch (error) {
    console.error("[PATCH /api/posts/[postId]/pin]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
