"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Check, Clock3, Save, X } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { LoadingButton } from "@/components/shared/LoadingButton";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
type AttendanceRecord = {
  id: string;
  studentId: string;
  status: Status | null;
  student: { id: string; name: string; email: string };
};
type AttendanceSession = {
  id: string;
  sessionDate: string;
  title: string;
  notes: string | null;
  records: AttendanceRecord[];
};
type AttendanceData = {
  members: {
    student: {
      id: string;
      name: string;
      email: string;
      department: string | null;
      approvalStatus: string;
    };
  }[];
  sessions: AttendanceSession[];
};
type DraftStatus = Status | "";

const statusOptions: { value: DraftStatus; label: string }[] = [
  { value: "", label: "Not marked" },
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "EXCUSED", label: "Excused" },
];

const statusStyles: Record<Status, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  LATE: "bg-amber-100 text-amber-800",
  EXCUSED: "bg-blue-100 text-blue-800",
};

function localDateValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function StatusPill({ status }: { status: Status | null }) {
  if (!status)
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        Not recorded
      </span>
    );
  const Icon =
    status === "PRESENT"
      ? Check
      : status === "LATE"
        ? Clock3
        : status === "EXCUSED"
          ? CalendarCheck2
          : X;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      <Icon className="h-3 w-3" />
      {status[0] + status.slice(1).toLowerCase()}
    </span>
  );
}

export function AttendanceClient({
  classId,
  role,
}: {
  classId: string;
  role: "FACULTY" | "STUDENT";
}) {
  const queryClient = useQueryClient();
  const isFaculty = role === "FACULTY";
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionDate, setSessionDate] = useState(localDateValue);
  const [title, setTitle] = useState("Class meeting");
  const [notes, setNotes] = useState("");
  const [statuses, setStatuses] = useState<Record<string, DraftStatus>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["classes", classId, "attendance"],
    queryFn: () =>
      apiClient.get<AttendanceData>(`/api/classes/${classId}/attendance`),
  });

  const members = useMemo(
    () =>
      (data?.members ?? [])
        .map((item) => item.student)
        .filter((student) => student.approvalStatus === "APPROVED"),
    [data?.members],
  );

  useEffect(() => {
    if (!selectedSessionId || !data) {
      setStatuses({});
      setSessionDate(localDateValue());
      setTitle("Class meeting");
      setNotes("");
      return;
    }
    const selected = data.sessions.find(
      (item) => item.id === selectedSessionId,
    );
    if (!selected) return;
    setSessionDate(selected.sessionDate.slice(0, 10));
    setTitle(selected.title);
    setNotes(selected.notes ?? "");
    setStatuses(
      Object.fromEntries(
        selected.records.map((record) => [
          record.studentId,
          record.status ?? "",
        ]),
      ),
    );
  }, [selectedSessionId, data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ id: string }>(`/api/classes/${classId}/attendance`, {
        sessionId: selectedSessionId || undefined,
        date: sessionDate,
        title,
        notes: notes || null,
        records: members.map((student) => ({
          studentId: student.id,
          status: statuses[student.id] || null,
        })),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["classes", classId, "attendance"],
      });
      setSelectedSessionId(result.id);
      toast.success("Attendance saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-5xl p-8 text-on-surface-variant">
        Loading attendance…
      </div>
    );
  if (isError || !data)
    return (
      <div className="mx-auto max-w-5xl p-8 text-error">
        Could not load attendance for this class.
      </div>
    );

  if (!isFaculty) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <CalendarCheck2 className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Class records
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">
            My attendance
          </h2>
          <p className="mt-1 text-on-surface-variant">
            Review the attendance records shared by your instructor.
          </p>
        </div>
        {data.sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
            No attendance sessions have been recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="divide-y divide-outline-variant/30">
              {data.sessions.map((attendanceSession) => {
                const record = attendanceSession.records[0];
                return (
                  <div
                    key={attendanceSession.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-on-surface">
                        {attendanceSession.title}
                      </h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {formatDate(attendanceSession.sessionDate)}
                        {attendanceSession.notes
                          ? ` · ${attendanceSession.notes}`
                          : ""}
                      </p>
                    </div>
                    <StatusPill status={record?.status ?? null} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const markedCount = members.filter(
    (student) => !!statuses[student.id],
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <CalendarCheck2 className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Class records
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">
          Attendance
        </h2>
        <p className="mt-1 text-on-surface-variant">
          Create a roll call for a class meeting and record each enrolled
          student’s status.
        </p>
      </div>

      <section className="mb-7 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-on-surface">
            {selectedSessionId ? "Edit attendance" : "New attendance session"}
          </h3>
          <select
            aria-label="Choose an existing attendance session"
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            className="h-10 rounded-lg border border-outline-variant/50 bg-surface-container px-3 text-sm text-on-surface"
          >
            <option value="">Create a new session</option>
            {data.sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {formatDate(item.sessionDate)} — {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-on-surface">
            Meeting date
            <input
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-on-surface">
            Session title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="h-10 w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3"
              placeholder="e.g. Lecture 1"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-on-surface md:col-span-2">
            Notes (optional)
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              className="h-10 w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3"
              placeholder="Topic or meeting notes"
            />
          </label>
        </div>

        <div className="mb-4 flex items-center justify-between border-b border-outline-variant/30 pb-3 text-sm">
          <span className="font-semibold text-on-surface">
            Enrolled students{" "}
            <span className="font-normal text-on-surface-variant">
              ({members.length})
            </span>
          </span>
          <span className="text-on-surface-variant">
            {markedCount} of {members.length} marked
          </span>
        </div>
        {members.length === 0 ? (
          <p className="rounded-lg bg-surface-container p-4 text-sm text-on-surface-variant">
            No approved students are enrolled in this class yet.
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {members.map((student) => (
              <div
                key={student.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-on-surface">{student.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {student.email}
                    {student.department ? ` · ${student.department}` : ""}
                  </p>
                </div>
                <select
                  aria-label={`Attendance status for ${student.name}`}
                  value={statuses[student.id] ?? ""}
                  onChange={(event) =>
                    setStatuses((current) => ({
                      ...current,
                      [student.id]: event.target.value as DraftStatus,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 text-sm sm:w-44"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-outline-variant/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">
            Unmarked students remain unrecorded; they are not automatically
            counted absent.
          </p>
          <LoadingButton
            variant="primary"
            isLoading={saveMutation.isPending}
            loadingText="Saving…"
            disabled={!sessionDate || !title.trim() || members.length === 0}
            onClick={() => saveMutation.mutate()}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> Save attendance
          </LoadingButton>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-on-surface">
          Previous sessions
        </h3>
        {data.sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">
            No sessions recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.sessions.map((item) => {
              const counts = item.records.reduce<Record<string, number>>(
                (result, record) => {
                  const key = record.status ?? "UNMARKED";
                  result[key] = (result[key] ?? 0) + 1;
                  return result;
                },
                {},
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSessionId(item.id)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left transition hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-semibold text-on-surface">
                      {item.title}
                    </span>
                    <span className="ml-2 text-sm text-on-surface-variant">
                      {formatDate(item.sessionDate)}
                    </span>
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {counts.PRESENT ?? 0} present · {counts.ABSENT ?? 0} absent
                    · {counts.LATE ?? 0} late · {counts.EXCUSED ?? 0} excused ·{" "}
                    {counts.UNMARKED ?? 0} unmarked
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
