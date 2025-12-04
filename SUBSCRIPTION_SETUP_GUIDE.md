# MenoEase Subscription System Setup Guide

This guide walks you through setting up the complete subscription system for MenoEase.

---

## 📋 **Overview**

The subscription system includes:
- 4 tiers: Free, Basic ($9.99/mo), Premium ($19.99/mo), Professional ($39.99/mo)
- Stripe integration for payments
- Tiered communication features (reminders & reports)
- Automated subscription management via webhooks
- User-friendly billing portal

---

## 🗄️ **Step 1: Database Setup**

### Run the SQL Script

1. Open Supabase SQL Editor
2. Open the file: `supabase/subscription_system.sql`
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run**

This will create:
- ✅ Subscription fields in `user_profiles`
- ✅ `subscription_tiers` table with 4 tiers
- ✅ `subscription_history` table for logging
- ✅ `reminders` and `reminder_logs` tables
- ✅ Helper functions and triggers

### Verify Tables Created

Run this query to verify:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'subscription_tiers',
  'subscription_history',
  'reminders',
  'reminder_logs'
);
```

You should see all 4 tables listed.

---

## 💳 **Step 2: Stripe Setup**

### 2.1 Create Stripe Account (if not done)

1. Go to https://stripe.com
2. Sign up or log in
3. Switch to **Test Mode** (toggle in top-right)

### 2.2 Create Products & Prices

For each tier (Basic, Premium, Professional), create a product:

**Basic Tier:**
1. Go to: Products → Add Product
2. Product name: `MenoEase Basic`
3. Description: `30-day history, basic insights, daily email reminders, weekly reports`
4. Add **Monthly** price:
   - Price: `$9.99`
   - Billing period: `Monthly`
   - Click **Add price**
5. Add **Yearly** price:
   - Click **Add another price**
   - Price: `$99.99`
   - Billing period: `Yearly`
   - Click **Add price**
6. Copy both **Price IDs** (starts with `price_...`)

**Premium Tier:**
1. Products → Add Product
2. Product name: `MenoEase Premium`
3. Description: `Unlimited history, advanced insights, customizable reminders & reports (email + SMS)`
4. Add Monthly price: `$19.99`
5. Add Yearly price: `$199.99`
6. Copy both Price IDs

**Professional Tier:**
1. Products → Add Product
2. Product name: `MenoEase Professional`
3. Description: `All Premium features + API access, white-label, dedicated support`
4. Add Monthly price: `$39.99`
5. Add Yearly price: `$399.99`
6. Copy both Price IDs

### 2.3 Update Database with Price IDs

Run this in Supabase SQL Editor (replace with your actual Price IDs):

```sql
UPDATE subscription_tiers
SET
  stripe_price_id_monthly = 'price_XXXXX',
  stripe_price_id_yearly = 'price_YYYYY'
WHERE tier_code = 'basic';

UPDATE subscription_tiers
SET
  stripe_price_id_monthly = 'price_XXXXX',
  stripe_price_id_yearly = 'price_YYYYY'
WHERE tier_code = 'premium';

UPDATE subscription_tiers
SET
  stripe_price_id_monthly = 'price_XXXXX',
  stripe_price_id_yearly = 'price_YYYYY'
WHERE tier_code = 'professional';
```

### 2.4 Set Up Webhook

1. Go to: Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Replace `your-site` with your actual Netlify site name
4. Listen to events → Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)

---

## 🔐 **Step 3: Environment Variables**

### Add to Netlify

Go to: Netlify → Your Site → Site configuration → Environment variables

Add these variables:

```bash
# Stripe Keys (from Stripe Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Already have these from earlier setup
EMAILJS_SERVICE_ID=...
EMAILJS_PUBLIC_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Add these new template IDs
EMAILJS_TEMPLATE_WELCOME=Meno_Welcome
EMAILJS_TEMPLATE_UPGRADE=Meno_Upgrade
EMAILJS_TEMPLATE_DOWNGRADE=Meno_Downgrade
EMAILJS_TEMPLATE_CANCELLED=Meno_Cancelled

# Optional: App URL (defaults to Netlify URL if not set)
VITE_APP_URL=https://your-site.netlify.app
```

### Add to Frontend (.env.local for development)

Create `.env.local` in project root:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:5173
```

---

## 🧪 **Step 4: Test Webhook Locally (Optional)**

To test webhooks during development:

### Install Stripe CLI

```bash
# Windows (via Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Forward Webhooks to Local Function

```bash
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook
```

This will give you a webhook signing secret for local testing.

### Run Netlify Dev

```bash
netlify dev
```

Now test subscriptions and see webhook events in real-time!

---

## ✅ **Step 5: Verify Installation**

### Test Database

Run this query to check subscription tiers:

```sql
SELECT tier_code, tier_name, price_monthly, price_yearly
FROM subscription_tiers
ORDER BY display_order;
```

You should see all 4 tiers.

### Test Subscription Service

In your browser console (after deploying):

```javascript
// Check if all tiers load
fetch('/.netlify/functions/get-subscription-status', {
  method: 'POST',
  body: JSON.stringify({ userId: 'your-user-id' })
})
```

### Test Checkout Flow

1. Deploy to Netlify
2. Log in to your app
3. Go to subscription page (you'll build this next)
4. Click "Subscribe" on a tier
5. Use Stripe test card: `4242 4242 4242 4242`
6. Check Supabase → user_profiles → your subscription_tier should update

---

## 🎨 **Step 6: Build UI Components (Next Phase)**

Now that the backend is set up, you can build:

1. **Pricing Page** - Show all tiers with features
2. **Subscription Management** - View/manage current plan
3. **Feature Gates** - Lock features based on tier
4. **Upgrade Prompts** - Show when users hit limits

Would you like me to create these UI components next?

---

## 🐛 **Troubleshooting**

### Webhook Not Working

1. Check Netlify function logs:
   - Netlify → Functions → stripe-webhook → View logs
2. Verify webhook secret is correct
3. Check Stripe Dashboard → Webhooks → Recent deliveries

### Subscription Not Updating

1. Check Supabase logs
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Check user has user_id in metadata

### Test Cards

Use these Stripe test cards:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

Any future date, any 3-digit CVC

---

## 📊 **Monitoring**

### Track Subscriptions

Query to see active subscriptions:

```sql
SELECT
  subscription_tier,
  subscription_status,
  COUNT(*) as count
FROM user_profiles
GROUP BY subscription_tier, subscription_status;
```

### View Recent Events

```sql
SELECT
  event_type,
  from_tier,
  to_tier,
  amount,
  created_at
FROM subscription_history
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🚀 **Next Steps**

1. ✅ Database setup - DONE
2. ✅ Stripe configuration - DONE
3. ✅ Webhook handler - DONE
4. ✅ Backend functions - DONE
5. ⏳ Build Pricing Page UI
6. ⏳ Build Subscription Management UI
7. ⏳ Add Feature Gates
8. ⏳ Test complete flow

**Ready to build the UI components?** Let me know and I'll create:
- Pricing page with tier comparison
- Subscription management dashboard
- Feature gate components
- Upgrade prompts
