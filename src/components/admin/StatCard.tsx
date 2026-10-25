import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string; // Material Symbol name
  iconBg: string; // Tailwind class e.g. "bg-primary-fixed"
  iconColor: string; // Tailwind class e.g. "text-primary"
  badge?: {
    label: string;
    type: "success" | "error" | "warning";
  };
  isAlert?: boolean; // true for Pending Reports card
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  badge,
  isAlert,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between card-shadow-1 relative overflow-hidden",
        isAlert ? "border-2 border-error-container" : "border border-surface-variant"
      )}
    >
      {/* Decorative Accent for Alert Cards */}
      {isAlert && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-error-container/20 rounded-bl-full pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="relative z-10">
          <p className="font-label-md text-on-surface-variant mb-1">{label}</p>
          <h3 className="font-headline-lg text-on-surface">{value}</h3>
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10",
            iconBg
          )}
        >
          <span
            className={cn("material-symbols-outlined", iconColor)}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
      </div>

      {badge && (
        <div className="mt-auto relative z-10">
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-xs",
              {
                "text-emerald-600 bg-emerald-50": badge.type === "success",
                "text-error bg-error-container/50": badge.type === "error",
                "text-amber-600 bg-amber-50": badge.type === "warning",
              }
            )}
          >
            {badge.type === "success" && (
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                trending_up
              </span>
            )}
            {badge.label}
          </div>
        </div>
      )}
    </div>
  );
}
