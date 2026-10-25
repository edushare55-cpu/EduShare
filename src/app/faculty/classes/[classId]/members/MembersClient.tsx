"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { approveStudent, rejectStudent, removeStudent } from "@/lib/actions/faculty";
import { LoadingButton } from "@/components/shared/LoadingButton";

type Student = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  department: string | null;
  joinedAt: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export function MembersClient({
  classId,
  pendingStudents,
  approvedStudents,
}: {
  classId: string;
  pendingStudents: Student[];
  approvedStudents: Student[];
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return approvedStudents;
    return approvedStudents.filter((student) =>
      [student.name, student.email, student.department ?? ""]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [approvedStudents, searchQuery]);

  const exportRoster = () => {
    const rows = [
      ["Student Name", "Email", "Department / Program", "Joined"],
      ...visibleStudents.map((student) => [
        student.name,
        student.email,
        student.department ?? "",
        new Date(student.joinedAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-information-sheet.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleApprove = async (userId: string) => {
    setIsProcessing(userId + "-approve");
    const result = await approveStudent(userId, classId);
    if (result.success) {
      toast.success("Student approved!");
    } else {
      toast.error(result.error);
    }
    setIsProcessing(null);
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this student?")) return;
    setIsProcessing(userId + "-reject");
    const result = await rejectStudent(userId, classId);
    if (result.success) {
      toast.success("Student rejected.");
    } else {
      toast.error(result.error);
    }
    setIsProcessing(null);
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this student? This action cannot be undone.")) return;
    setIsProcessing(userId + "-remove");
    const result = await removeStudent(userId, classId);
    if (result.success) {
      toast.success("Student removed successfully.");
    } else {
      toast.error(result.error);
    }
    setIsProcessing(null);
  };

  return (
    <div className="space-y-xl animate-in fade-in duration-300">
      {/* Pending Approvals */}
      <section>
        <h2 className="font-headline-md text-on-surface mb-md flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">pending_actions</span>
          Pending Approvals
          <span className="bg-secondary/10 text-secondary text-sm py-0.5 px-2 rounded-full ml-2">
            {pendingStudents.length}
          </span>
        </h2>
        {pendingStudents.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center">
            <p className="text-on-surface-variant font-body-md">No pending requests at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {pendingStudents.map((student) => (
              <div
                key={student.id}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg">
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      student.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push(`/faculty/users/${student.id}`)}
                  >
                    <h3 className="font-label-md text-on-surface hover:underline">{student.name}</h3>
                    <p className="text-sm text-on-surface-variant hover:no-underline">{student.email}</p>
                  </div>
                </div>
                <div className="mt-auto flex gap-2 pt-4 border-t border-outline-variant/20">
                  <LoadingButton
                    variant="primary"
                    isLoading={isProcessing === student.id + "-approve"}
                    disabled={isProcessing !== null}
                    onClick={() => handleApprove(student.id)}
                    className="flex-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Approve
                  </LoadingButton>
                  <LoadingButton
                    variant="outline"
                    isLoading={isProcessing === student.id + "-reject"}
                    disabled={isProcessing !== null}
                    onClick={() => handleReject(student.id)}
                    className="flex-1 text-error border-error/50 hover:bg-error/10 hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Reject
                  </LoadingButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved Members */}
      <section>
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Enrolled Students
              <span className="bg-primary/10 text-primary text-sm py-0.5 px-2 rounded-full">
                {approvedStudents.length}
              </span>
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">Search student profiles or export the visible roster as CSV.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, email, or program"
                className="pl-9"
                aria-label="Search student information"
              />
            </div>
            <button
              type="button"
              onClick={exportRoster}
              disabled={visibleStudents.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
        {approvedStudents.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center">
            <p className="text-on-surface-variant font-body-md">No students have enrolled yet.</p>
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center">
            <p className="text-on-surface-variant font-body-md">No students match “{searchQuery}”.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-label-md">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department / Program</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {visibleStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          student.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span 
                        className="font-medium text-on-surface cursor-pointer hover:text-primary hover:underline transition-colors"
                        onClick={() => router.push(`/faculty/users/${student.id}`)}
                      >
                        {student.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{student.email}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{student.department || "Not provided"}</td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {new Date(student.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Approved
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <LoadingButton
                        variant="danger"
                        isLoading={isProcessing === student.id + "-remove"}
                        disabled={isProcessing !== null}
                        onClick={() => handleRemove(student.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity py-1 px-3 text-xs h-8 ml-auto"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                        Remove
                      </LoadingButton>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-outline-variant/20">
              {visibleStudents.map((student) => (
                <div key={student.id} className="p-4 hover:bg-surface-container-lowest/50 transition-colors flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          student.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span 
                          className="font-medium text-on-surface block cursor-pointer hover:text-primary hover:underline transition-colors"
                          onClick={() => router.push(`/faculty/users/${student.id}`)}
                        >
                          {student.name}
                        </span>
                        <span className="text-xs text-on-surface-variant block">{student.email}</span>
                        <span className="text-xs text-on-surface-variant block">{student.department || "Department not provided"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3 mt-1">
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Approved
                    </span>
                    <LoadingButton
                      variant="danger"
                      isLoading={isProcessing === student.id + "-remove"}
                      disabled={isProcessing !== null}
                      onClick={() => handleRemove(student.id)}
                      className="py-1.5 px-3 text-xs h-8"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_remove</span>
                      Remove
                    </LoadingButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
