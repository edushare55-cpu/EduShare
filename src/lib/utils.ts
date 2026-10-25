/**
 * lib/utils.ts
 *
 * General-purpose utility functions used throughout EduShare.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ─── Tailwind Class Merger ────────────────────────────────────────────────────

/**
 * Merges Tailwind CSS classes safely, resolving conflicts.
 * This is the standard shadcn/ui utility.
 *
 * @example cn("px-4 py-2", condition && "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

/**
 * Formats a date to a human-readable string.
 * @param date - Date object or ISO string
 * @param pattern - date-fns format pattern (default: "MMM d, yyyy")
 */
export function formatDate(
  date: Date | string,
  pattern: string = "MMM d, yyyy"
): string {
  return format(new Date(date), pattern);
}

/**
 * Returns a relative time string (e.g., "3 hours ago", "2 days ago").
 * @param date - Date object or ISO string
 */
export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Formats a date with time (e.g., "Jan 5, 2025 at 2:30 PM").
 */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

// ─── File Utilities ───────────────────────────────────────────────────────────

/**
 * Converts a file size in bytes to a human-readable string.
 * @example formatFileSize(1048576) → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Returns a file's extension from its name or URL.
 * @example getFileExtension("report.pdf") → "pdf"
 */
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

// ─── Section Code Generator ─────────────────────────────────────────────────────

/**
 * Generates a random 6-character alphanumeric section code (uppercase).
 * Used when a faculty member creates a new section.
 * @example generateSectionCode() → "A3X9TK"
 */
export function generateSectionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Returns the initials from a full name (up to 2 characters).
 * @example getInitials("Maria Santos") → "MS"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncates a string to a given length and appends "...".
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
}
