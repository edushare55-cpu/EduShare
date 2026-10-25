import { SyllabusClient } from "@/components/shared/SyllabusClient";

export const metadata = { title: "Syllabus" };

export default function FacultySyllabusPage({
  params,
}: {
  params: { classId: string };
}) {
  return <SyllabusClient classId={params.classId} role="FACULTY" />;
}
