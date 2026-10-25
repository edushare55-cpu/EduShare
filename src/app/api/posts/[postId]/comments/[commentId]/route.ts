/**
 * app/api/posts/[postId]/comments/[commentId]/route.ts
 *
 * DELETE /api/posts/[postId]/comments/[commentId]
 * — Comment author, Faculty (class owner), or Admin: Delete a comment
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { commentId } = params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: { include: { class: { select: { facultyId: true } } } },
      },
    });

    if (!comment) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    const isCommentAuthor = comment.authorId === profile.id;
    const isFacultyOwner  = profile.role === "FACULTY" && comment.post.class.facultyId === profile.id;
    const isAdmin         = profile.role === "ADMIN";

    if (!isCommentAuthor && !isFacultyOwner && !isAdmin) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return successResponse(null, "Comment deleted.");
  } catch (error) {
    console.error("[DELETE /api/posts/[postId]/comments/[commentId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
