/**
 * app/api/notifications/read/route.ts
 *
 * PATCH /api/notifications/read
 * — Mark specific notifications (or all) as read for the authenticated user
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const markReadSchema = z.object({
  notificationIds: z.array(z.string().cuid()).optional(),
  // If omitted → mark ALL unread notifications as read
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, ERRORS.VALIDATION.status);
    }

    const { notificationIds } = parsed.data;
    let updatedCount: number;

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      // Security: scope to profile.id — users can only mark their own notifications
      const result = await prisma.notification.updateMany({
        where: {
          id:     { in: notificationIds },
          userId: profile.id,
        },
        data: { isRead: true },
      });
      updatedCount = result.count;
    } else {
      // Mark all unread as read
      const result = await prisma.notification.updateMany({
        where: { userId: profile.id, isRead: false },
        data: { isRead: true },
      });
      updatedCount = result.count;
    }

    return successResponse({ updatedCount }, `${updatedCount} notification(s) marked as read.`);
  } catch (error) {
    console.error("[PATCH /api/notifications/read]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
