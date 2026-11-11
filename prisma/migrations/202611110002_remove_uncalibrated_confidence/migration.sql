-- Remove numeric confidence fields that were never calibrated as probabilities.
-- Identity evidence remains categorical through identity_map.ambiguous and link presence.
ALTER TABLE "identity_map" DROP CONSTRAINT IF EXISTS "identity_confidence_range";
ALTER TABLE "identity_map" DROP COLUMN IF EXISTS "confidence";

ALTER TABLE "journey_event" DROP CONSTRAINT IF EXISTS "journey_identity_confidence_range";
ALTER TABLE "journey_event" DROP COLUMN IF EXISTS "identity_confidence";

ALTER TABLE "growth_recommendation" DROP CONSTRAINT IF EXISTS "recommendation_ranges";
ALTER TABLE "growth_recommendation" DROP COLUMN IF EXISTS "confidence";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'recommendation_score_range'
          AND conrelid = 'growth_recommendation'::regclass
    ) THEN
        ALTER TABLE "growth_recommendation"
            ADD CONSTRAINT "recommendation_score_range" CHECK ("score" >= 0 AND "score" <= 100);
    END IF;
END $$;
