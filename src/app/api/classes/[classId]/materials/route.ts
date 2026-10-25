import { z } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { errorResponse, ERRORS, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const materialSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().max(1000).nullable().optional(),
    fileName: z.string().trim().min(1).max(255),
    fileUrl: z.string().url(),
    fileKey: z.string().min(1).max(500),
    fileType: z.string().max(150),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(50 * 1024 * 1024),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } },
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return errorResponse(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.status,
      );
    if (session.profile.role !== "FACULTY")
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const course = await prisma.class.findUnique({
      where: { id: params.classId },
      select: { facultyId: true },
    });
    if (!course)
      return errorResponse(ERRORS.NOT_FOUND.message, ERRORS.NOT_FOUND.status);
    if (course.facultyId !== session.profile.id)
      return errorResponse(ERRORS.FORBIDDEN.message, ERRORS.FORBIDDEN.status);

    const parsed = materialSchema.safeParse(await request.json());
    if (!parsed.success)
      return errorResponse(
        parsed.error.errors[0].message,
        ERRORS.VALIDATION.status,
      );
    if (!parsed.data.fileKey.startsWith(`${params.classId}/materials/`)) {
      return errorResponse(
        "File must be uploaded to this class's materials folder.",
        ERRORS.VALIDATION.status,
      );
    }

    const material = await prisma.classMaterial.create({
      data: {
        ...parsed.data,
        classId: params.classId,
        uploadedById: session.profile.id,
      },
    });
    return successResponse(material, "Course file attached.", 201);
  } catch (error) {
    console.error("[POST class material]", error);
    return errorResponse(ERRORS.INTERNAL.message, ERRORS.INTERNAL.status);
  }
}
