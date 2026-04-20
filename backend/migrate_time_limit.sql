-- Migration: rename time_limit_minutes -> time_limit_seconds
-- Converts existing values from minutes to seconds.
-- Run once against your PostgreSQL database:

ALTER TABLE problems
  RENAME COLUMN time_limit_minutes TO time_limit_seconds;

UPDATE problems
  SET time_limit_seconds = time_limit_seconds * 60
  WHERE time_limit_seconds IS NOT NULL;
