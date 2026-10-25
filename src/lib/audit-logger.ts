import prisma from "@/lib/prisma";

export interface LogActionParams {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
}

/**
 * Immutable Audit Logger
 * 
 * Safely logs actions to the database. It swallows any errors to ensure
 * the primary user action (e.g. deleting a post, grading a submission)
 * is never interrupted by a logging failure.
 */
export async function logAction({
  userId,
  action,
  resourceType,
  resourceId,
  details,
}: LogActionParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details,
      },
    });
  } catch (error) {
    // Fail silently so we don't crash the API response
    console.error("[AuditLogger] Failed to write audit log:", error);
  }
}
