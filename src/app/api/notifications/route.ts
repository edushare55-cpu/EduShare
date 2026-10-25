/**
 * app/api/notifications/route.ts
 *
 * GET /api/notifications  — Fetch notifications for the authenticated user
 * Supports optional ?unreadOnly=true query parameter
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;
    const unreadOnly = request.nextUrl.searchParams.get("unreadOnly");

    const whereClause = {
      userId: profile.id,
      ...(unreadOnly === "true" ? { isRead: false } : {}),
    };

    // Run both queries in parallel
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: profile.id, isRead: false },
      }),
    ]);

    return successResponse({ notifications, unreadCount });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    const { profile } = session;

    // Hard delete ONLY notifications where isRead is true and belongs to the authenticated user.
    const deleted = await prisma.notification.deleteMany({
      where: {
        userId: profile.id,
        isRead: true,
      },
    });

    return successResponse({ deletedCount: deleted.count });
  } catch (error) {
    console.error("[DELETE /api/notifications]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
