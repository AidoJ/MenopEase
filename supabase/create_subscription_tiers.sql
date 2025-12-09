-- ===================================================
-- CREATE SUBSCRIPTION TIERS TABLE
-- Run this in Supabase SQL Editor to fix the error
-- ===================================================

-- Create the subscription_tiers table
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

-- Enable Row Level Security
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON subscription_tiers;

-- Create policy to allow everyone to view active tiers
CREATE POLICY "Anyone can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (is_active = true);

-- Verify the table was created
SELECT tier_code, tier_name, price_monthly, price_yearly, is_active 
FROM subscription_tiers 
ORDER BY display_order;
