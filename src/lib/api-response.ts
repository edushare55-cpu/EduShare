/**
 * lib/api-response.ts
 *
 * Standardized API response factory.
 * Every route must use these helpers — never return raw NextResponse.json().
 */

import { NextResponse } from "next/server";

// ─── Response Types ───────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

// ─── Response Factories ───────────────────────────────────────────────────────

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function errorResponse(
  error: string,
  status = 400,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error, code }, { status });
}

// ─── Standard Error Constants ─────────────────────────────────────────────────

export const ERRORS = {
  UNAUTHORIZED: { message: "Unauthorized. Please log in.", status: 401 },
  FORBIDDEN:    { message: "You do not have permission.", status: 403 },
  NOT_FOUND:    { message: "Resource not found.", status: 404 },
  CONFLICT:     { message: "Resource already exists.", status: 409 },
  VALIDATION:   { message: "Validation failed.", status: 422 },
  INTERNAL:     { message: "An internal server error occurred.", status: 500 },
} as const;
