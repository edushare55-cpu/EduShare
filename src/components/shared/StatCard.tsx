import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string; // Material Symbol name
  iconBg: string; // e.g. "bg-primary-fixed"
  iconColor: string; // e.g. "text-on-primary-fixed"
  isAlert?: boolean; // true for Pending Submissions card
  alertLabel?: string; // e.g. "Action Needed"
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  isAlert,
  alertLabel,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex items-center gap-6 hover:shadow-[0_8px_20px_rgba(0,35,111,0.08)] transition-shadow duration-300",
        isAlert ? "relative overflow-hidden" : ""
      )}
    >
      {isAlert && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-error-container/20 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
      )}

      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          iconBg,
          iconColor,
          isAlert ? "z-10 relative" : ""
        )}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      <div className={cn(isAlert ? "z-10 relative" : "")}>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="font-headline-xl text-headline-xl text-primary leading-none">
            {value}
          </h3>
          {isAlert && alertLabel && (
            <span className="font-label-sm text-label-sm text-error bg-error-container px-2 py-0.5 rounded-full flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                priority_high
              </span>
              {alertLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
