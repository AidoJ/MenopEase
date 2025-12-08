# Netlify Environment Variables Guide

## 🔑 Complete Environment Variables List

This document lists ALL environment variables needed for your MenoTrak application to work correctly on Netlify.

## 📋 How to Add Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** → **Environment variables**
4. Click **Add variable** for each variable below
5. **Important**: Variable names are case-sensitive and must match exactly

---

## 🌐 Frontend Variables (VITE_*)

These variables are available in the browser and must start with `VITE_` for Vite to include them.

### Supabase Configuration
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- Supabase Dashboard → Project Settings → API
- Copy the "Project URL" and "anon public" key

### Stripe Configuration (Frontend)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx or pk_test_xxxxx
```

**Where to find:**
- Stripe Dashboard → Developers → API keys
- Use the "Publishable key" (starts with `pk_`)

### EmailJS Configuration
```
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxx
VITE_EMAILJS_TEMPLATE_ID_WELCOME=template_xxxxx
VITE_EMAILJS_TEMPLATE_ID_SUMMARY=template_xxxxx
VITE_EMAILJS_TEMPLATE_ID_REPORT=template_xxxxx
```

**Where to find:**
- EmailJS Dashboard → Integration → Email Service
- EmailJS Dashboard → Email Templates

### Weather API
```
VITE_WEATHER_API_KEY=your_openweathermap_api_key
```

**Where to find:**
- OpenWeatherMap → API keys section

### App URL
```
VITE_APP_URL=https://your-site.netlify.app
```

**Note:** This should be your Netlify site URL. You can also use `https://${site-name}.netlify.app`

---

## 🔒 Backend Function Variables (NOT VITE_*)

These variables are **server-side only** and should **NOT** have the `VITE_` prefix. They are used by Netlify Functions.

### Stripe Configuration (Backend)
```
STRIPE_SECRET_KEY=sk_live_xxxxx or sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Where to find:**
- Stripe Dashboard → Developers → API keys
- Use the "Secret key" (starts with `sk_`)
- Stripe Dashboard → Developers → Webhooks → Add endpoint → Copy signing secret

**⚠️ CRITICAL:** Never expose the secret key in the frontend!

### Supabase Configuration (Backend)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- Supabase Dashboard → Project Settings → API
- Copy the "Project URL" (same as VITE_SUPABASE_URL)
- Copy the "service_role" key (NOT the anon key - this has admin access)

**⚠️ CRITICAL:** 
- The service role key bypasses Row Level Security (RLS)
- Never expose this key in the frontend
- Only use in server-side functions

### EmailJS Configuration (Backend)
```
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_PUBLIC_KEY=xxxxx
EMAILJS_TEMPLATE_WELCOME=template_xxxxx
EMAILJS_TEMPLATE_UPGRADE=template_xxxxx
EMAILJS_TEMPLATE_DOWNGRADE=template_xxxxx
EMAILJS_TEMPLATE_CANCELLED=template_xxxxx
```

**Note:** These are the same values as the VITE_ versions, but without the prefix for use in functions.

### Twilio Configuration (Backend)
```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Where to find:**
- Twilio Console → Account → Account SID
- Twilio Console → Account → Auth Token
- Twilio Console → Phone Numbers → Manage → Active numbers

---

## 📝 Quick Reference Table

| Variable Name | Type | Required | Where Used |
|--------------|------|----------|------------|
| `VITE_SUPABASE_URL` | Frontend | ✅ Yes | React app |
| `VITE_SUPABASE_ANON_KEY` | Frontend | ✅ Yes | React app |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend | ✅ Yes | React app |
| `VITE_EMAILJS_SERVICE_ID` | Frontend | Optional | React app |
| `VITE_EMAILJS_PUBLIC_KEY` | Frontend | Optional | React app |
| `VITE_EMAILJS_TEMPLATE_ID_*` | Frontend | Optional | React app |
| `VITE_WEATHER_API_KEY` | Frontend | Optional | React app |
| `VITE_APP_URL` | Frontend | ✅ Yes | React app |
| `STRIPE_SECRET_KEY` | Backend | ✅ Yes | Netlify Functions |
| `STRIPE_WEBHOOK_SECRET` | Backend | ✅ Yes | Stripe webhook function |
| `SUPABASE_URL` | Backend | ✅ Yes | Netlify Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | ✅ Yes | Netlify Functions |
| `EMAILJS_SERVICE_ID` | Backend | Optional | Netlify Functions |
| `EMAILJS_PUBLIC_KEY` | Backend | Optional | Netlify Functions |
| `EMAILJS_TEMPLATE_*` | Backend | Optional | Netlify Functions |
| `TWILIO_ACCOUNT_SID` | Backend | Optional | SMS function |
| `TWILIO_AUTH_TOKEN` | Backend | Optional | SMS function |
| `TWILIO_PHONE_NUMBER` | Backend | Optional | SMS function |

---

## ✅ Verification Checklist

After adding all variables:

- [ ] All `VITE_*` variables are set for frontend
- [ ] All backend variables (without `VITE_`) are set for functions
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is different from `VITE_SUPABASE_ANON_KEY`
- [ ] `STRIPE_SECRET_KEY` is different from `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] No placeholder values (like "your_supabase_project_url")
- [ ] No extra spaces or quotes around values
- [ ] Triggered a new deploy after adding variables

---

## 🧪 Testing Variables

### Test Frontend Variables
1. Deploy to Netlify
2. Open browser console
3. Check for Supabase initialization message
4. Verify no "Missing environment variables" errors

### Test Backend Functions
1. Use Netlify Functions logs
2. Test a function endpoint (e.g., `/api/create-checkout-session`)
3. Check function logs for errors

---

## 🔄 Updating Variables

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Click on the variable to edit
3. Update the value
4. **Important:** Trigger a new deploy for changes to take effect
   - Go to Deploys tab
   - Click "Trigger deploy" → "Clear cache and deploy site"

---

## 🚨 Common Mistakes

1. ❌ Using `SUPABASE_URL` instead of `VITE_SUPABASE_URL` in frontend
2. ❌ Using `VITE_` prefix on backend function variables
3. ❌ Using anon key instead of service role key in functions
4. ❌ Using publishable key instead of secret key in functions
5. ❌ Leaving placeholder values
6. ❌ Not redeploying after adding variables
7. ❌ Extra spaces or quotes in values

---

## 📞 Need Help?

If you're still having issues:
1. Check Netlify build logs
2. Check browser console for frontend errors
3. Check Netlify Functions logs for backend errors
4. Verify all variables are set correctly
5. Ensure you've triggered a new deploy
