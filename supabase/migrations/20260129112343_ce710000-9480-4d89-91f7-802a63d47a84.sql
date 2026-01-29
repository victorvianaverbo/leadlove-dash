-- Add metrics_avg3days column to store 3-day average metrics
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS metrics_avg3days JSONB DEFAULT NULL;