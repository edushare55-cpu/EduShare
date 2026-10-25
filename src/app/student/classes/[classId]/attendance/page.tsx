import { AttendanceClient } from "@/components/shared/AttendanceClient";

export const metadata = { title: "My attendance" };

export default function StudentAttendancePage({
  params,
}: {
  params: { classId: string };
}) {
  return <AttendanceClient classId={params.classId} role="STUDENT" />;
}
