import { AttendanceClient } from "@/components/shared/AttendanceClient";

export const metadata = { title: "Attendance" };

export default function FacultyAttendancePage({
  params,
}: {
  params: { classId: string };
}) {
  return <AttendanceClient classId={params.classId} role="FACULTY" />;
}
