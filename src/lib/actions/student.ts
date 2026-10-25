"use server";

import prisma from "@/lib/prisma";

export async function getClassmates(classId: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            student: { name: "asc" },
          },
        },
      },
    });

    if (!classData) {
      return { success: false, error: "Class not found." };
    }

    const classmates = classData.members.map((m) => m.student);
    return { success: true, classmates };
  } catch (error: any) {
    console.error("[getClassmates] Error:", error);
    return { success: false, error: "Failed to fetch classmates." };
  }
}
