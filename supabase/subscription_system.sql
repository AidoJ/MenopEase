-- ============================================
-- MENOEASE SUBSCRIPTION SYSTEM
-- ============================================
-- Run this in Supabase SQL Editor
-- This sets up the complete subscription and communication system

-- ===================================================
-- 1. ADD SUBSCRIPTION FIELDS TO user_profiles
-- ===================================================

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

-- ===================================================
-- 2. CREATE SUBSCRIPTION TIERS TABLE
-- ===================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_code TEXT PRIMARY KEY,
  tier_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier definitions with detailed features
INSERT INTO subscription_tiers (tier_code, tier_name, display_order, price_monthly, price_yearly, features) VALUES
(
  'free',
  'Free',
  1,
  0.00,
  0.00,
  '{
    "tracking": true,
    "history_days": 7,
    "insights": false,
    "export_pdf": false,
    "reminders": {
      "enabled": false,
      "max_per_day": 0,
      "methods": [],
      "frequencies": []
    },
    "reports": {
      "enabled": false,
      "methods": [],
      "frequencies": []
    },
    "support": "community"
  }'::jsonb
),
(
  'basic',
  'Basic',
  2,
  9.99,
  99.99,
  '{
    "tracking": true,
    "history_days": 30,
    "insights": true,
    "export_pdf": true,
    "reminders": {
      "enabled": true,
      "max_per_day": 1,
      "methods": ["email"],
      "frequencies": ["daily"]
    },
    "reports": {
      "enabled": true,
      "methods": ["email"],
      "frequencies": ["weekly"]
    },
    "support": "email"
  }'::jsonb
),
(
  'premium',
  'Premium',
  3,
  19.99,
  199.99,
  '{
    "tracking": true,
    "history_days": null,
    "insights": true,
    "advanced_insights": true,
    "export_pdf": true,
    "reminders": {
      "enabled": true,
      "max_per_day": 5,
      "methods": ["email", "sms"],
      "frequencies": ["hourly", "every_2_hours", "every_3_hours", "daily", "twice_daily"]
    },
    "reports": {
      "enabled": true,
      "methods": ["email", "sms"],
      "frequencies": ["daily", "weekly", "monthly"]
    },
    "priority_support": true,
    "support": "priority_email"
  }'::jsonb
),
(
  'professional',
  'Professional',
  4,
  39.99,
  399.99,
  '{
    "tracking": true,
    "history_days": null,
    "insights": true,
    "advanced_insights": true,
    "export_pdf": true,
    "reminders": {
      "enabled": true,
      "max_per_day": 10,
      "methods": ["email", "sms"],
      "frequencies": ["hourly", "every_2_hours", "every_3_hours", "daily", "twice_daily"]
    },
    "reports": {
      "enabled": true,
      "methods": ["email", "sms"],
      "frequencies": ["daily", "weekly", "monthly"]
    },
    "api_access": true,
    "white_label": true,
    "priority_support": true,
    "dedicated_support": true,
    "support": "phone"
  }'::jsonb
)
ON CONFLICT (tier_code) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  display_order = EXCLUDED.display_order,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON subscription_tiers;

-- Allow everyone to read tiers (for pricing page)
CREATE POLICY "Anyone can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (is_active = true);

-- ===================================================
-- 3. CREATE SUBSCRIPTION HISTORY TABLE
-- ===================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_tier TEXT,
  to_tier TEXT,
  amount DECIMAL(10,2),
  period TEXT, -- 'monthly' or 'yearly'
  stripe_event_id TEXT,
  stripe_invoice_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_history_user
  ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created
  ON subscription_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event
  ON subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_event
  ON subscription_history(stripe_event_id);

-- Add comments
COMMENT ON COLUMN subscription_history.event_type IS 'Event type: subscription_created, subscription_updated, payment_succeeded, payment_failed, subscription_cancelled, subscription_expired, tier_upgraded, tier_downgraded';

-- Enable RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;

CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- ===================================================
-- 4. CREATE REMINDERS TABLES
-- ===================================================

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  time TIME NOT NULL,
  days_of_week INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type);

-- Add comments
COMMENT ON COLUMN reminders.reminder_type IS 'Reminder type: medication, tracking, check_in, custom';
COMMENT ON COLUMN reminders.days_of_week IS 'Array of days [0=Sunday, 1=Monday, ..., 6=Saturday]. Empty array = daily';

-- Create reminder logs table
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  method TEXT,
  status TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user ON reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder ON reminder_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_date ON reminder_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON reminder_logs(status);

-- Add comments
COMMENT ON COLUMN reminder_logs.method IS 'Delivery method: email, sms';
COMMENT ON COLUMN reminder_logs.status IS 'Status: sent, failed, delivered, bounced';

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can view own reminder logs" ON reminder_logs;

CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reminder logs" ON reminder_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ===================================================
-- 5. HELPER FUNCTIONS
-- ===================================================

-- Function to automatically log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log tier changes
  IF (TG_OP = 'UPDATE' AND OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
    INSERT INTO subscription_history (
      user_id,
      event_type,
      from_tier,
      to_tier,
      metadata
    )
    VALUES (
      NEW.user_id,
      CASE
        WHEN NEW.subscription_tier > OLD.subscription_tier THEN 'tier_upgraded'
        WHEN NEW.subscription_tier < OLD.subscription_tier THEN 'tier_downgraded'
        ELSE 'tier_changed'
      END,
      OLD.subscription_tier,
      NEW.subscription_tier,
      jsonb_build_object(
        'old_status', OLD.subscription_status,
        'new_status', NEW.subscription_status,
        'changed_at', NOW()
      )
    );
  END IF;

  -- Log status changes
  IF (TG_OP = 'UPDATE' AND OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
    INSERT INTO subscription_history (
      user_id,
      event_type,
      from_tier,
      to_tier,
      metadata
    )
    VALUES (
      NEW.user_id,
      'subscription_status_changed',
      NEW.subscription_tier,
      NEW.subscription_tier,
      jsonb_build_object(
        'old_status', OLD.subscription_status,
        'new_status', NEW.subscription_status,
        'changed_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trg_user_profiles_subscription_change ON user_profiles;
CREATE TRIGGER trg_user_profiles_subscription_change
AFTER UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION log_subscription_change();

-- Function to update updated_at timestamp on reminders
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reminders_updated_at ON reminders;
CREATE TRIGGER trg_reminders_updated_at
BEFORE UPDATE ON reminders
FOR EACH ROW EXECUTE FUNCTION update_reminders_updated_at();

-- ===================================================
-- 6. HELPER VIEWS (OPTIONAL - FOR ANALYTICS)
-- ===================================================

-- View for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT
  subscription_tier,
  subscription_status,
  subscription_period,
  COUNT(*) as user_count,
  COUNT(CASE WHEN cancel_at_period_end THEN 1 END) as cancelling_count
FROM user_profiles
GROUP BY subscription_tier, subscription_status, subscription_period;

-- ===================================================
-- COMPLETE!
-- ===================================================
-- Next steps:
-- 1. Update Stripe Price IDs in subscription_tiers table
-- 2. Set up Stripe webhook in Netlify
-- 3. Configure environment variables
