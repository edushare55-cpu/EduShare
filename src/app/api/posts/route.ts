/**
 * app/api/posts/route.ts
 *
 * GET  /api/posts?classId=xxx  — Fetch the post feed for a section
 * POST /api/posts               — Faculty creates an announcement or assignment
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";
import { createPostSchema } from "@/lib/validations/post";
import { createBulkNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// ─── Access Helpers ───────────────────────────────────────────────────────────

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

// ─── GET /api/posts ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const classId = request.nextUrl.searchParams.get("classId");

    let whereClause: any = {};

    if (classId) {
      const hasAccess = await verifyClassAccess(classId, profile.id, profile.role);
      if (!hasAccess) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
      whereClause = { classId };
    } else {
      // Resolve accessible class IDs based on role
      if (profile.role === "STUDENT") {
        const memberships = await prisma.classMembership.findMany({
          where: { studentId: profile.id },
          select: { classId: true },
        });
        whereClause = { classId: { in: memberships.map((m) => m.classId) } };
      } else if (profile.role === "FACULTY") {
        const classes = await prisma.class.findMany({
          where: { facultyId: profile.id },
          select: { id: true },
        });
        whereClause = { classId: { in: classes.map((c) => c.id) } };
      } else if (profile.role === "ADMIN") {
        whereClause = {}; // Admin sees all
      }
    }

    // Optional filters: Announcement views contain only faculty-authored
    // non-assignment posts; assignments are managed in their own area.
    const isSubmissionParam = request.nextUrl.searchParams.get("isSubmission");
    if (isSubmissionParam === "false") {
      whereClause = {
        ...whereClause,
        isSubmissionPost: false,
        author: { is: { role: "FACULTY" } },
      };
    } else if (isSubmissionParam === "true") {
      whereClause.isSubmissionPost = true;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        class: { select: { id: true, name: true, classCode: true } },
        files: true,
        _count: { select: { comments: true, submissions: true } },
      },
      orderBy: [
        { isPinned: "desc" },  // Pinned posts first
        { createdAt: "desc" }, // Then newest
      ],
      take: classId ? 50 : 20, // Limit to 50 for a specific class, 20 for feed
    });

    return successResponse(posts);
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    // Class posts are official announcements; only faculty may publish them.
    if (profile.role !== "FACULTY") {
      return errorResponse("Only faculty can publish class announcements.", ERRORS.FORBIDDEN.status);
    }

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { classId, content, category, isPinned, isSubmissionPost, submissionDeadline, attachedLink, files } = parsed.data;

    // Verify user has access to the class
    const hasAccess = await verifyClassAccess(classId, profile.id, profile.role);
    if (!hasAccess) return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    // Validate submission deadline
    if (isSubmissionPost) {
      if (!submissionDeadline) {
        return errorResponse("Assignment posts require a submission deadline.", 400);
      }
      if (new Date(submissionDeadline) <= new Date()) {
        return errorResponse("Deadline must be in the future.", 400);
      }
    }

    // Fetch the class for notification purposes
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, facultyId: true },
    });
    if (!cls) return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);

    // Create post + files in a single transaction
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          classId,
          authorId: profile.id,
          content,
          category: category ?? null,
          isPinned,
          isSubmissionPost,
          submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
          attachedLink: attachedLink ?? null,
        },
      });

      if (files.length > 0) {
        await tx.postFile.createMany({
          data: files.map((f) => ({ ...f, postId: created.id })),
        });
      }

      return created;
    });

    // Dispatch notifications (non-blocking)
    try {
      if (profile.role === "FACULTY") {
        // Notify all enrolled students
        const memberships = await prisma.classMembership.findMany({
          where: { classId },
          select: { studentId: true },
        });
        const studentIds = memberships.map((m) => m.studentId);
        const preview = content.length > 60 ? content.slice(0, 60) + "..." : content;
        const notificationType = isSubmissionPost ? "NEW_ASSIGNMENT" : "NEW_POST";
        await createBulkNotifications(
          studentIds,
          notificationType,
          `New ${isSubmissionPost ? "assignment" : "announcement"} in "${cls.name}": "${preview}"`,
          post.id,
          `/student/classes/${classId}/${isSubmissionPost ? "assignments" : "feed"}`
        );
      }
    } catch (notifError) {
      console.warn("[POST /api/posts] Notification failed:", notifError);
    }

    // Return the full post with relations
    const fullPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        files: true,
        _count: { select: { comments: true, submissions: true } },
      },
    });

    return successResponse(fullPost, "Post created successfully.", 201);
  } catch (error) {
    console.error("[POST /api/posts]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
