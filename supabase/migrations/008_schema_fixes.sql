-- Migration 008: Schema Fixes
-- Add azure_ad_oid to profiles and 'idea' status to post_status enum

-- Add azure_ad_oid to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS azure_ad_oid text;
CREATE INDEX IF NOT EXISTS profiles_azure_ad_oid_idx ON public.profiles(azure_ad_oid) WHERE azure_ad_oid IS NOT NULL;

-- Add 'idea' to post_status enum
-- Note: PostgreSQL doesn't support IF NOT EXISTS for enum values directly
-- We need to check if the value exists first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'idea' 
    AND enumtypid = 'public.post_status'::regtype
  ) THEN
    -- Add 'idea' before 'draft'
    ALTER TYPE public.post_status ADD VALUE 'idea' BEFORE 'draft';
  END IF;
END $$;
