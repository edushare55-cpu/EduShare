"use client";

import { useState } from "react";
import { useResolveReport } from "@/hooks/use-reports";
import { useRouter } from "next/navigation";
import type { Report } from "@/types";

interface ReportsClientProps {
  initialReports: Report[];
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const { mutate: resolveReport, isPending } = useResolveReport();

  const filteredReports = initialReports.filter((report) => {
    const resourceName = report.post?.content || "User Profile";
    const reporterName = report.reporter?.name || "Unknown";

    const matchesSearch =
      resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporterName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesReason =
      filterReason.length === 0 || filterReason.includes(report.reason);

    const matchesStatus =
      filterStatus.length === 0 || filterStatus.includes(report.status);

    return matchesSearch && matchesReason && matchesStatus;
  });

  const handleAction = (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    resolveReport(
      { reportId, status, actionTaken: status === "RESOLVED" ? "Admin reviewed and resolved." : "Admin dismissed the report." },
      {
        onSuccess: () => {
          router.refresh();
        },
      }
    );
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="font-headline-lg text-on-surface mb-2">
            Flagged Content
          </h3>
          <p className="font-body-md text-on-surface-variant">
            Review and manage content reported by users across the network.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-on-surface bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-level-1 border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-label-md uppercase tracking-wider text-xs border-b border-outline-variant/50">
                <th className="p-4 font-semibold">Resource Details</th>
                <th className="p-4 font-semibold">Reporter</th>
                <th className="p-4 font-semibold">Reason</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
              {filteredReports.map((report) => (
                <ReportTableRow
                  key={report.id}
                  report={report}
                  onAction={handleAction}
                  isPending={isPending}
                />
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    No reports match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ReportTableRow({
  report,
  onAction,
  isPending,
}: {
  report: Report;
  onAction: (id: string, status: "RESOLVED" | "DISMISSED") => void;
  isPending: boolean;
}) {
  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-error-container text-on-error-container";
      case "RESOLVED":
        return "bg-primary-fixed text-on-primary-fixed";
      case "DISMISSED":
        return "bg-surface-container-highest text-on-surface";
      default:
        return "bg-surface-container-highest text-on-surface";
    }
  };

  const getStatusIcon = (status: Report["status"]) => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "RESOLVED":
        return "check_circle";
      case "DISMISSED":
        return "cancel";
      default:
        return "pending";
    }
  };

  const resourceName = report.post?.content || "Profile / Unknown";

  return (
    <tr className="hover:bg-surface transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">flag</span>
          </div>
          <div>
            <p className="font-semibold text-primary line-clamp-1">{resourceName}</p>
            <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
              {report.description || "No description provided."}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <p className="font-medium">{report.reporter?.name || "Unknown"}</p>
        <p className="text-xs text-on-surface-variant">
          {report.reporter?.role || "User"}
        </p>
      </td>
      <td className="p-4">
        <span
          className={`bg-surface-container-highest text-on-surface px-2 py-1 rounded text-xs font-medium border border-outline-variant/50`}
        >
          {report.reason}
        </span>
      </td>
      <td className="p-4">
        <span
          className={`${getStatusBadge(
            report.status
          )} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max`}
        >
          <span className={`material-symbols-outlined text-[14px]`}>
            {getStatusIcon(report.status)}
          </span>
          {report.status}
        </span>
      </td>
      <td className="p-4">
        {report.status === "PENDING" ? (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            <button
              onClick={() => onAction(report.id, "RESOLVED")}
              disabled={isPending}
              className="px-3 py-1.5 border border-primary text-primary hover:bg-primary-container rounded font-label-sm transition-colors disabled:opacity-50"
            >
              Resolve
            </button>
            <button
              onClick={() => onAction(report.id, "DISMISSED")}
              disabled={isPending}
              className="px-3 py-1.5 border border-outline text-on-surface-variant hover:bg-surface-container-high rounded font-label-sm transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="text-right text-xs text-on-surface-variant">
            {report.actionTaken || "Actioned."}
          </div>
        )}
      </td>
    </tr>
  );
}
