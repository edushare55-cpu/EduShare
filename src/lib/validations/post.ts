/**
 * lib/validations/post.ts
 *
 * Zod validation schemas for posts, comments, submissions, and reports.
 */

import { z } from "zod";

// ─── Post Schemas ─────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  classId: z.string().cuid("Invalid section ID"),
  content: z.string().min(1, "Content is required").max(5000, "Content must not exceed 5000 characters"),
  category: z.string().max(50, "Category must not exceed 50 characters").optional(),
  isPinned: z.boolean().default(false),
  isSubmissionPost: z.boolean().default(false),
  submissionDeadline: z.string().datetime().optional().nullable(),
  attachedLink: z.string().url("Attached link must be a valid URL (e.g. https://...)").optional().nullable(),
  files: z
    .array(
      z.object({
        fileName: z.string().min(1, "File name is required"),
        fileUrl:  z.string().url("Invalid file URL"),
        fileType: z.string().min(1, "File type is required"),
        fileSize: z.number().int().positive("File size must be positive"),
      })
    )
    .max(10, "Maximum 10 files per post")
    .default([]),
});

export const updatePostSchema = z.object({
  content:  z.string().min(1).max(5000).optional(),
  category: z.string().max(50).optional(),
  isPinned: z.boolean().optional(),
});

// ─── Comment Schemas ──────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment must not exceed 2000 characters"),
});

// ─── Submission Schemas ───────────────────────────────────────────────────────

export const createSubmissionSchema = z.object({
  postId:   z.string().cuid("Invalid post ID"),
  fileUrl:  z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
});

// ─── Report Schemas ───────────────────────────────────────────────────────────

export const createReportSchema = z
  .object({
    postId:         z.string().cuid("Invalid post ID").optional(),
    reportedUserId: z.string().cuid("Invalid user ID").optional(),
    reason: z.enum([
      "INAPPROPRIATE",
      "BULLYING",
      "UNRELATED",
      "SPAM",
      "OTHER",
    ]),
    description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
  })
  .refine((data) => data.postId || data.reportedUserId, {
    message: "Must report either a post or a user",
  });

export const resolveReportSchema = z.object({
  status:      z.enum(["RESOLVED", "DISMISSED"]),
  actionTaken: z.string().max(500).optional(),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type CreatePostInput       = z.infer<typeof createPostSchema>;
export type UpdatePostInput       = z.infer<typeof updatePostSchema>;
export type CreateCommentInput    = z.infer<typeof createCommentSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type CreateReportInput     = z.infer<typeof createReportSchema>;
export type ResolveReportInput    = z.infer<typeof resolveReportSchema>;
