/**
 * lib/validations/class.ts
 *
 * Zod validation schemas for section/class operations.
 */

import { z } from "zod";

// ─── Create Section ───────────────────────────────────────────────────────────

export const createClassSchema = z.object({
  name: z
    .string()
    .min(2, "Section name must be at least 2 characters")
    .max(100, "Section name must not exceed 100 characters"),
  subject: z
    .string()
    .min(2, "Subject must be at least 2 characters")
    .max(100, "Subject must not exceed 100 characters"),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
  facultyId: z.string().min(1, "Faculty assignment is required"),
});

// ─── Join Section via Code ────────────────────────────────────────────────────

export const joinClassSchema = z.object({
  classCode: z
    .string()
    .min(1, "Section code is required")
    .max(20, "Section code is too long")
    .transform((val) => val.toUpperCase()),
});

// ─── Update Section ───────────────────────────────────────────────────────────

export const updateClassSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  isArchived:  z.boolean().optional(),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type CreateClassInput  = z.infer<typeof createClassSchema>;
export type JoinClassInput    = z.infer<typeof joinClassSchema>;
export type UpdateClassInput  = z.infer<typeof updateClassSchema>;
