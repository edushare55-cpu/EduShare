/**
 * lib/validations/lesson.ts
 *
 * Zod validation schemas for lessons, assessments, questions, and attempts.
 */

import { z } from "zod";

// ─── Lesson Schemas ───────────────────────────────────────────────────────────

export const createLessonSchema = z.object({
  classId:       z.string().cuid("Invalid section ID"),
  title:         z.string().min(3, "Title must be at least 3 characters").max(200),
  description:   z.string().max(1000).optional(),
  order:         z.number().int().positive("Order must be a positive integer"),
  videoUrl:      z.string().url("Invalid video URL"),
  videoKey:      z.string().min(1, "Video storage key is required"),
  videoDuration: z.number().int().positive("Duration must be positive"),
  thumbnailUrl:  z.string().url().optional(),
  isPublished:   z.boolean().default(false),
});

export const updateLessonSchema = z.object({
  title:        z.string().min(3).max(200).optional(),
  description:  z.string().max(1000).optional(),
  order:        z.number().int().positive().optional(),
  isPublished:  z.boolean().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const lessonProgressSchema = z.object({
  lessonId:       z.string().cuid(),
  watchedSeconds: z.number().int().nonnegative(),
  highestSecond:  z.number().int().nonnegative(),
});

export const reorderLessonSchema = z.object({
  newOrder: z.number().int().positive(),
});

// ─── Assessment Schemas ───────────────────────────────────────────────────────

export const createAssessmentSchema = z.object({
  lessonId:         z.string().cuid(),
  title:            z.string().min(3).max(200),
  instructions:     z.string().max(2000).optional(),
  passingScore:     z.number().int().min(1).max(100).default(75),
  maxAttempts:      z.number().int().min(0).max(10).default(3),
  timeLimitMins:    z.number().int().min(1).max(180).optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  showResults:      z.boolean().default(true),
});

export const updateAssessmentSchema = createAssessmentSchema
  .omit({ lessonId: true })
  .partial();

// ─── Question Schemas ─────────────────────────────────────────────────────────

const questionChoiceSchema = z.object({
  choiceText: z.string().min(1, "Choice text required").max(500),
  isCorrect:  z.boolean(),
  order:      z.number().int().nonnegative(),
});

const matchPairSchema = z.object({
  leftItem:  z.string().min(1).max(500),
  rightItem: z.string().min(1).max(500),
  order:     z.number().int().nonnegative(),
});

export const createQuestionSchema = z.discriminatedUnion("type", [
  // MULTIPLE_CHOICE — exactly one correct choice
  z.object({
    type:         z.literal("MULTIPLE_CHOICE"),
    assessmentId: z.string().cuid(),
    order:        z.number().int().nonnegative(),
    questionText: z.string().min(1).max(2000),
    points:       z.number().int().positive().default(1),
    imageUrl:     z.string().url().optional(),
    explanation:  z.string().max(1000).optional(),
    choices:      z.array(questionChoiceSchema)
      .min(2, "At least 2 choices required")
      .max(6, "Maximum 6 choices")
      .refine(
        (c) => c.filter((x) => x.isCorrect).length === 1,
        "Multiple choice must have exactly one correct answer"
      ),
  }),

  // MULTIPLE_SELECT — one or more correct choices
  z.object({
    type:         z.literal("MULTIPLE_SELECT"),
    assessmentId: z.string().cuid(),
    order:        z.number().int().nonnegative(),
    questionText: z.string().min(1).max(2000),
    points:       z.number().int().positive().default(1),
    imageUrl:     z.string().url().optional(),
    explanation:  z.string().max(1000).optional(),
    choices:      z.array(questionChoiceSchema)
      .min(2)
      .max(8)
      .refine(
        (c) => c.filter((x) => x.isCorrect).length >= 1,
        "Must have at least one correct answer"
      ),
  }),

  // TRUE_OR_FALSE — exactly 2 choices
  z.object({
    type:         z.literal("TRUE_OR_FALSE"),
    assessmentId: z.string().cuid(),
    order:        z.number().int().nonnegative(),
    questionText: z.string().min(1).max(2000),
    points:       z.number().int().positive().default(1),
    imageUrl:     z.string().url().optional(),
    explanation:  z.string().max(1000).optional(),
    choices:      z.array(questionChoiceSchema)
      .length(2, "True/False must have exactly 2 choices")
      .refine(
        (c) => c.filter((x) => x.isCorrect).length === 1,
        "Exactly one correct answer required"
      ),
  }),

  // MATCHING — left-right pairs
  z.object({
    type:         z.literal("MATCHING"),
    assessmentId: z.string().cuid(),
    order:        z.number().int().nonnegative(),
    questionText: z.string().min(1).max(2000),
    points:       z.number().int().positive().default(1),
    imageUrl:     z.string().url().optional(),
    explanation:  z.string().max(1000).optional(),
    matchPairs:   z.array(matchPairSchema)
      .min(2, "At least 2 pairs required")
      .max(10, "Maximum 10 pairs"),
  }),

  // SHORT_ANSWER — text input, manually graded
  z.object({
    type:         z.literal("SHORT_ANSWER"),
    assessmentId: z.string().cuid(),
    order:        z.number().int().nonnegative(),
    questionText: z.string().min(1).max(2000),
    points:       z.number().int().positive().default(1),
    imageUrl:     z.string().url().optional(),
    explanation:  z.string().max(1000).optional(),
  }),
]);

// ─── Attempt Schemas ──────────────────────────────────────────────────────────

export const startAttemptSchema = z.object({
  assessmentId: z.string().cuid(),
});

export const saveAnswerSchema = z.object({
  questionId:        z.string().cuid(),
  selectedChoiceIds: z.array(z.string()).default([]),
  matchAnswers: z.array(z.object({
    leftItem:          z.string(),
    selectedRightItem: z.string(),
  })).optional(),
  textAnswer: z.string().max(5000).optional(),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().cuid(),
});

export const gradeShortAnswerSchema = z.object({
  studentAnswerId: z.string().cuid(),
  isCorrect:       z.boolean(),
  pointsEarned:    z.number().nonnegative(),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type CreateLessonInput      = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput      = z.infer<typeof updateLessonSchema>;
export type LessonProgressInput    = z.infer<typeof lessonProgressSchema>;
export type ReorderLessonInput     = z.infer<typeof reorderLessonSchema>;
export type CreateAssessmentInput  = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput  = z.infer<typeof updateAssessmentSchema>;
export type CreateQuestionInput    = z.infer<typeof createQuestionSchema>;
export type StartAttemptInput      = z.infer<typeof startAttemptSchema>;
export type SaveAnswerInput        = z.infer<typeof saveAnswerSchema>;
export type SubmitAttemptInput     = z.infer<typeof submitAttemptSchema>;
export type GradeShortAnswerInput  = z.infer<typeof gradeShortAnswerSchema>;
