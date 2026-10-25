import prisma from "@/lib/prisma";
import { MembersClient } from "./MembersClient";

export const metadata = { title: "Student Information Sheet" };

export default async function FacultyClassMembersPage({
  params,
}: {
  params: { classId: string };
}) {
  // Fetch class to ensure it exists and get its members
  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      members: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              approvalStatus: true,
              department: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  if (!classData) return <div>Class not found.</div>;

  const pendingStudents = classData.members
    .filter((m) => m.student.approvalStatus === "PENDING")
    .map((m) => ({ ...m.student, joinedAt: m.joinedAt.toISOString() }));

  const approvedStudents = classData.members
    .filter((m) => m.student.approvalStatus === "APPROVED")
    .map((m) => ({ ...m.student, joinedAt: m.joinedAt.toISOString() }));

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Student Information Sheet</h1>
        <p className="text-on-surface-variant text-lg">Review the class roster, find student contact details, and manage enrollment approvals.</p>
      </div>

      <MembersClient 
        classId={params.classId} 
        pendingStudents={pendingStudents as any} 
        approvedStudents={approvedStudents as any} 
      />
    </div>
  );
}
