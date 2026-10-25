"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveStudent(userId: string, classId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: "APPROVED" },
    });
    revalidatePath(`/faculty/classes/${classId}/members`);
    return { success: true };
  } catch (error: any) {
    console.error("[approveStudent] Error:", error);
    return { success: false, error: "Failed to approve student." };
  }
}

export async function rejectStudent(userId: string, classId: string) {
  try {
    // Safely remove their class membership and set them back to REJECTED.
    // We no longer attempt to delete the User account, preserving data integrity.
    await prisma.$transaction([
      prisma.classMembership.deleteMany({
        where: { studentId: userId, classId: classId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { approvalStatus: "REJECTED" },
      }),
    ]);
    
    revalidatePath(`/faculty/classes/${classId}/members`);
    return { success: true };
  } catch (error: any) {
    console.error("[rejectStudent] Error:", error);
    return { success: false, error: "Failed to reject student." };
  }
}

export async function removeStudent(userId: string, classId: string) {
  try {
    // 1. Delete the class membership to remove them from the roster
    await prisma.classMembership.deleteMany({
      where: { studentId: userId, classId: classId },
    });

    // 2. Check if they have any other classes
    const remainingMemberships = await prisma.classMembership.count({
      where: { studentId: userId },
    });

    // 3. If this was their only class, safely set their platform status back to PENDING.
    // This allows them to join another class and be re-evaluated, without destroying their account.
    if (remainingMemberships === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { approvalStatus: "PENDING" },
      });
    }

    revalidatePath(`/faculty/classes/${classId}/members`);
    return { success: true };
  } catch (error: any) {
    console.error("[removeStudent] Error:", error);
    return { success: false, error: "Failed to remove student from class." };
  }
}
