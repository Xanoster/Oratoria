-- Migration: add_evaluations_table
-- Description: Creates the evaluations table for storing user speech evaluation results
-- Generated: 2026-01-24

-- Create evaluations table
CREATE TABLE IF NOT EXISTS "evaluations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "recording_id" UUID,
    "transcript" TEXT NOT NULL,
    "expected_text" TEXT,
    "user_level" VARCHAR(5) NOT NULL, -- A0, A1, A2, B1, B2
    "mode" VARCHAR(20) NOT NULL, -- placement, lesson
    "overall_score" DOUBLE PRECISION NOT NULL,
    "pronunciation_score" DOUBLE PRECISION NOT NULL,
    "grammar_score" DOUBLE PRECISION NOT NULL,
    "fluency_score" DOUBLE PRECISION NOT NULL,
    "detected_errors" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, needs_review
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "evaluations_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluations_recording_id_fkey" FOREIGN KEY ("recording_id") 
        REFERENCES "recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "evaluations_user_id_idx" ON "evaluations"("user_id");
CREATE INDEX IF NOT EXISTS "evaluations_user_id_mode_idx" ON "evaluations"("user_id", "mode");
CREATE INDEX IF NOT EXISTS "evaluations_status_idx" ON "evaluations"("status");

-- Comment for documentation
COMMENT ON TABLE "evaluations" IS 'Stores user speech evaluation results with scoring for pronunciation, grammar, and fluency';
COMMENT ON COLUMN "evaluations"."mode" IS 'placement = strict scoring for level assessment; lesson = adaptive scoring for practice';
COMMENT ON COLUMN "evaluations"."detected_errors" IS 'JSONB array of error objects with type, token, expected, explanation, position';
