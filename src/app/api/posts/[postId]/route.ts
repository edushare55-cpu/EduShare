/**
 * app/api/posts/[postId]/route.ts
 *
 * GET    /api/posts/[postId]  — Get single post with full details
 * PATCH  /api/posts/[postId]  — Author or Faculty: Update post
 * DELETE /api/posts/[postId]  — Author, Faculty owner, or Admin: Delete post
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { updatePostSchema } from "@/lib/validations/post";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

// ─── Class Access Helper ──────────────────────────────────────────────────────

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

// ─── GET /api/posts/[postId] ──────────────────────────────────────────────────

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
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        files: true,
        class: { select: { id: true, name: true, facultyId: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    const hasAccess = await verifyClassAccess(post.classId, profile.id, profile.role);
    if (!hasAccess) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    return successResponse(post);
  } catch (error) {
    console.error("[GET /api/posts/[postId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── PATCH /api/posts/[postId] ────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const { postId } = params;

    if (profile.role === "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { class: { select: { facultyId: true } } },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Authorization: Faculty who owns the class OR the post's own author (student)
    const isFacultyOwner = profile.role === "FACULTY" && post.class.facultyId === profile.id;
    const isOwnPost = profile.role === "STUDENT" && post.authorId === profile.id;

    if (!isFacultyOwner && !isOwnPost) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: parsed.data,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        files: true,
        _count: { select: { comments: true, submissions: true } },
      },
    });

    return successResponse(updated, "Post updated.");
  } catch (error) {
    console.error("[PATCH /api/posts/[postId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── DELETE /api/posts/[postId] ───────────────────────────────────────────────

export async function DELETE(
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
      include: { 
        class: { select: { facultyId: true } },
        files: { select: { fileUrl: true } },
        submissions: { select: { fileUrl: true } }
      },
    });
    if (!post) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Authorization
    const isFacultyOwner = profile.role === "FACULTY" && post.class.facultyId === profile.id;
    const isOwnPost = profile.role === "STUDENT" && post.authorId === profile.id;
    const isAdmin = profile.role === "ADMIN";

    if (!isFacultyOwner && !isOwnPost && !isAdmin) {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    // Physical File Cleanup
    const supabase = createClient();
    
    // 1. Delete Post Files
    const postFilePaths = post.files
      .filter((f) => f.fileUrl)
      .map((f) => f.fileUrl.split("post_files/")[1])
      .filter(Boolean);
      
    if (postFilePaths.length > 0) {
      const { error } = await supabase.storage.from("post_files").remove(postFilePaths);
      if (error) console.error("[DELETE /api/posts/[postId]] Storage delete (post_files) failed:", error);
    }

    // 2. Delete associated Submission Files
    const submissionFilePaths = post.submissions
      .filter((s) => s.fileUrl)
      .map((s) => s.fileUrl!.split("submissions/")[1])
      .filter(Boolean);
      
    if (submissionFilePaths.length > 0) {
      const { error } = await supabase.storage.from("submissions").remove(submissionFilePaths);
      if (error) console.error("[DELETE /api/posts/[postId]] Storage delete (submissions) failed:", error);
    }

    // Cascade handles PostFile, Comment, Submission, Report DB records
    await prisma.post.delete({ where: { id: postId } });

    await logAction({
      userId: profile.id,
      action: "DELETE_POST",
      resourceType: "POST",
      resourceId: postId,
      details: {
        postContentSnippet: post.content ? post.content.substring(0, 50) : "",
        classId: post.classId,
        authorId: post.authorId,
        deletedByRole: profile.role
      }
    });

    return successResponse(null, "Post deleted.");
  } catch (error) {
    console.error("[DELETE /api/posts/[postId]]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
