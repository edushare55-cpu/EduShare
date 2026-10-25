import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { successResponse, errorResponse, ERRORS } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse(ERRORS.UNAUTHORIZED.message, ERRORS.UNAUTHORIZED.status);

    if (session.profile.role !== "ADMIN") {
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);
    }

    const deleted = await prisma.notification.deleteMany({
      where: { 
        userId: session.profile.id,
        isRead: true 
      },
    });

    return successResponse({ count: deleted.count }, "All read notifications cleared.");
  } catch (error) {
    console.error("[DELETE /api/admin/notifications/clear-all]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
