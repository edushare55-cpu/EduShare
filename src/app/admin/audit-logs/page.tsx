"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Search, ChevronLeft, ChevronRight, History, ShieldAlert, CheckCircle2, Trash2, KeyRound, Activity } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

// --- UI Formatters ---

function ActionBadge({ action }: { action: string }) {
  const getTheme = () => {
    switch (action) {
      case "ADMIN_DELETE_USER":
      case "DELETE_POST":
        return { color: "bg-error/10 text-error border-error/20", icon: <Trash2 className="w-3 h-3 mr-1" /> };
      case "ADMIN_PASSWORD_RESET":
        return { color: "bg-warning/10 text-warning-strong border-warning/20", icon: <KeyRound className="w-3 h-3 mr-1" /> };
      case "REVIEW_SUBMISSION":
        return { color: "bg-success/10 text-success border-success/20", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
      default:
        return { color: "bg-primary/10 text-primary border-primary/20", icon: <Activity className="w-3 h-3 mr-1" /> };
    }
  };

  const theme = getTheme();
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${theme.color}`}>
      {theme.icon}
      {action.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

function DetailsFormatter({ log }: { log: AuditLog }) {
  if (log.action === "ADMIN_DELETE_USER") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-on-surface">Permanently deleted user account</p>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="bg-surface-container-high px-2 py-0.5 rounded-md">Role: {log.details.targetRole}</span>
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded-md truncate max-w-[150px]" title={log.resourceId}>ID: {log.resourceId}</span>
        </div>
      </div>
    );
  }
  if (log.action === "ADMIN_PASSWORD_RESET") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-on-surface">Forced user password reset</p>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="bg-surface-container-high px-2 py-0.5 rounded-md">Role: {log.details.targetRole}</span>
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded-md truncate max-w-[150px]" title={log.resourceId}>ID: {log.resourceId}</span>
        </div>
      </div>
    );
  }
  if (log.action === "DELETE_POST") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-on-surface">Deleted class post</p>
        <div className="flex flex-col gap-1 text-xs text-on-surface-variant mt-1">
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded-md w-fit">Class ID: {log.details.classId}</span>
          {log.details.contentSnippet && (
             <span className="italic">"{log.details.contentSnippet}"</span>
          )}
        </div>
      </div>
    );
  }
  if (log.action === "REVIEW_SUBMISSION") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-on-surface">Graded student submission</p>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
          <span className="bg-surface-container-high px-2 py-0.5 rounded-md">New Status: {log.details.newStatus}</span>
        </div>
      </div>
    );
  }

  // Fallback for unknown actions
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-on-surface">{log.action}</p>
      <pre className="text-xs bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 max-w-xs overflow-x-auto whitespace-pre-wrap font-mono text-on-surface-variant">
        {JSON.stringify(log.details, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const take = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * take;
      const res = await fetch(`/api/admin/audit-logs?skip=${skip}&take=${take}&search=${encodeURIComponent(search)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch audit logs");
      }

      setLogs(data.data.logs);
      setTotal(data.data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, take]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to first page
  };

  const totalPages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Audit Logs
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Immutable record of critical administrative and system actions.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <form onSubmit={handleSearch} className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by action or resource ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </form>
          
          <div className="text-sm text-muted-foreground">
            Total Records: <span className="font-medium text-foreground">{total}</span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Resource</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-on-surface capitalize">{log.resourceType.toLowerCase()}</div>
                      <div className="text-xs text-on-surface-variant font-mono mt-0.5" title={log.resourceId}>
                        {log.resourceId.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-on-surface">{log.user.name}</div>
                      <div className="text-xs text-on-surface-variant">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px]">
                      <DetailsFormatter log={log} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y bg-background">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p>Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-destructive">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No audit logs found matching your criteria.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col gap-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <ActionBadge action={log.action} />
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{log.user.name}</div>
                    <div className="text-[11px] text-muted-foreground">{log.user.email}</div>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="font-semibold text-foreground capitalize mr-2">{log.resourceType.toLowerCase()}</span>
                  <span className="font-mono text-xs text-muted-foreground">{log.resourceId.substring(0, 12)}...</span>
                </div>
                
                <div className="mt-1">
                  <DetailsFormatter log={log} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
