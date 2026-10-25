import { SyllabusClient } from "@/components/shared/SyllabusClient";

export const metadata = { title: "Syllabus" };

export default function StudentSyllabusPage({
  params,
}: {
  params: { classId: string };
}) {
  return <SyllabusClient classId={params.classId} role="STUDENT" />;
}
