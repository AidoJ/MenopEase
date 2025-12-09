-- ===================================================
-- ADD SUBSCRIPTION COLUMNS TO user_profiles TABLE
-- Run this in Supabase SQL Editor to fix the error
-- ===================================================

-- Add subscription fields to user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_period TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS subscription_start_date DATE,
  ADD COLUMN IF NOT EXISTS subscription_end_date DATE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_end_date DATE,
  ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{
    "reminders": {
      "method": "email",
      "frequency": "daily",
      "start_time": "08:00",
      "end_time": "20:00",
      "enabled": false
    },
    "reports": {
      "frequency": "weekly",
      "time": "17:00",
      "day_of_week": 1,
      "day_of_month": 1,
      "method": "email",
      "enabled": false
    }
  }'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier
  ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status
  ON user_profiles(subscription_status);

-- Add comments
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription tier: free, basic, premium, professional';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Subscription status: active, cancelled, expired, trialing, past_due';
COMMENT ON COLUMN user_profiles.subscription_period IS 'Billing period: monthly or yearly';
COMMENT ON COLUMN user_profiles.communication_preferences IS 'User communication preferences for reminders and reports';

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name LIKE 'subscription%'
ORDER BY column_name;
