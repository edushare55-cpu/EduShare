/**
 * lib/notifications.ts
 *
 * Centralized notification dispatch engine.
 * Import and call these functions from any API route or Server Action
 * that performs an action requiring user notification.
 */

import prisma from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "NEW_POST"
  | "NEW_ASSIGNMENT"
  | "NEW_COMMENT"
  | "NEW_SUBMISSION"
  | "SUBMISSION_REVIEWED"
  | "REPORT_RESOLVED"
  | "CLASS_JOINED"
  // Admin
  | "NEW_REPORT"
  | "USER_REGISTERED"
  | "SYSTEM_ALERT"
  // Phase 2
  | "LESSON_PUBLISHED"
  | "LESSON_COMPLETED"
  | "ASSESSMENT_PASSED"
  | "ASSESSMENT_FAILED"
  | "ASSESSMENT_GRADED";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  referenceId?: string;
  link?: string;
}

// ─── Single Notification ──────────────────────────────────────────────────────

/**
 * Creates a single notification record for one user.
 * Fires-and-forgets — call without awaiting if notification
 * failure should not block the main response.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId:      input.userId,
      type:        input.type,
      message:     input.message,
      referenceId: input.referenceId,
      link:        input.link,
      isRead:      false,
    },
  });
}

// ─── Bulk Notifications ───────────────────────────────────────────────────────

/**
 * Creates notifications for multiple users in a single DB round-trip.
 * Used for faculty posts — notifies all enrolled students at once.
 * Silently skips duplicate inserts.
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  message: string,
  referenceId?: string,
  link?: string
): Promise<void> {
  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      message,
      referenceId,
      link,
      isRead: false,
    })),
    skipDuplicates: true,
  });
}

// ─── Admin Notifications ──────────────────────────────────────────────────────

/**
 * Dispatches a notification to all active ADMIN users.
 */
export async function dispatchAdminNotification(payload: {
  type: NotificationType;
  message: string;
  referenceId?: string;
  link?: string;
}): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    const adminIds = admins.map((a) => a.id);
    await createBulkNotifications(
      adminIds,
      payload.type,
      payload.message,
      payload.referenceId,
      payload.link
    );
  } catch (error) {
    console.error("[dispatchAdminNotification] Failed:", error);
  }
}
