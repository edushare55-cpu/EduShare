import { redirect } from "next/navigation";

export default function ClassRootPage({ params }: { params: { classId: string } }) {
  redirect(`/student/classes/${params.classId}/feed`);
}
