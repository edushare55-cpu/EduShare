import { redirect } from "next/navigation";

export default function ClassRedirectPage({ params }: { params: { classId: string } }) {
  redirect(`/faculty/classes/${params.classId}/feed`);
}
