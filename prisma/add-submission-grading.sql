-- Run once against an existing PostgreSQL database when enabling assignment grading.
ALTER TABLE "submissions"
  ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "feedback" TEXT;