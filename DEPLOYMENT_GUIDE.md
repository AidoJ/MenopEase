# 🚀 Netlify Deployment Guide - MenoTrak

Complete step-by-step guide to deploy your MenoTrak application to Netlify.

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Netlify account (free tier works)
- [ ] Supabase project set up
- [ ] Stripe account (for subscriptions)
- [ ] All environment variables ready (see `NETLIFY_ENV_VARIABLES.md`)

---

## 🔧 Step 1: Prepare Your Code

### 1.1 Verify Local Build Works

```bash
# Install dependencies
npm install

# Test build locally
npm run build

# Test preview
npm run preview
```

**Expected result:** Build should complete without errors and create a `dist/` folder.

### 1.2 Verify File Structure

Your project should have:
```
├── netlify.toml          ✅ Configuration file
├── package.json          ✅ With all dependencies
├── vite.config.js       ✅ Build configuration
├── index.html           ✅ Entry point
├── src/                 ✅ Source code
└── netlify/
    └── functions/       ✅ Serverless functions
```

### 1.3 Commit and Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

---

## 🌐 Step 2: Connect to Netlify

### 2.1 Create Netlify Site

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository (`5. MenoTrak` or your repo name)

### 2.2 Configure Build Settings

Netlify should auto-detect these from `netlify.toml`, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

If auto-detection fails, set manually:
1. Go to **Site settings** → **Build & deploy**
2. Set the values above

---

## 🔑 Step 3: Set Environment Variables

### 3.1 Add Frontend Variables

1. Go to **Site settings** → **Environment variables**
2. Click **"Add variable"**
3. Add each variable from the **Frontend Variables** section in `NETLIFY_ENV_VARIABLES.md`

**Required Frontend Variables:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_APP_URL
```

**Optional Frontend Variables:**
```
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_PUBLIC_KEY
VITE_EMAILJS_TEMPLATE_ID_WELCOME
VITE_EMAILJS_TEMPLATE_ID_SUMMARY
VITE_EMAILJS_TEMPLATE_ID_REPORT
VITE_WEATHER_API_KEY
```

### 3.2 Add Backend Function Variables

Add these **without** the `VITE_` prefix for server-side functions:

**Required Backend Variables:**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

**Optional Backend Variables:**
```
EMAILJS_SERVICE_ID
EMAILJS_PUBLIC_KEY
EMAILJS_TEMPLATE_WELCOME
EMAILJS_TEMPLATE_UPGRADE
EMAILJS_TEMPLATE_DOWNGRADE
EMAILJS_TEMPLATE_CANCELLED
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

### 3.3 Important Notes

- ⚠️ **VITE_ prefix:** Only frontend variables need this
- ⚠️ **Service Role Key:** Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) for functions
- ⚠️ **Stripe Keys:** Use secret key for functions, publishable key for frontend
- ⚠️ **No Quotes:** Don't wrap values in quotes
- ⚠️ **No Spaces:** No leading/trailing spaces

---

## 🚀 Step 4: Deploy

### 4.1 Initial Deploy

1. After connecting the repository, Netlify will automatically start deploying
2. Go to **Deploys** tab to watch the build
3. Wait for build to complete (usually 2-5 minutes)

### 4.2 Trigger New Deploy (After Adding Env Vars)

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for deployment to complete

### 4.3 Verify Deployment

1. Click on your site URL (e.g., `https://your-site.netlify.app`)
2. Open browser console (F12)
3. Check for:
   - ✅ Supabase initialization message
   - ✅ No "Missing environment variables" errors
   - ✅ App loads correctly

---

## 🔍 Step 5: Verify Functions

### 5.1 Test Functions

1. Go to **Functions** tab in Netlify dashboard
2. You should see your functions listed:
   - `create-billing-portal`
   - `create-checkout-session`
   - `generate-reports`
   - `process-reminders`
   - `send-email`
   - `send-sms`
   - `stripe-webhook`

### 5.2 Test Function Endpoints

Test a function (e.g., create-checkout-session):
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_xxx","userId":"user_xxx"}'
```

Or use a tool like Postman or your browser's fetch API.

### 5.3 Check Function Logs

1. Go to **Functions** tab
2. Click on a function name
3. View **Logs** to see any errors

---

## 🎯 Step 6: Configure Stripe Webhook

### 6.1 Get Webhook URL

Your webhook URL will be:
```
https://your-site.netlify.app/.netlify/functions/stripe-webhook
```

### 6.2 Add Webhook in Stripe

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your webhook URL
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to Netlify as `STRIPE_WEBHOOK_SECRET`

---

## ✅ Step 7: Final Verification

### 7.1 Frontend Checklist

- [ ] Site loads without errors
- [ ] Authentication works (login/signup)
- [ ] Dashboard loads
- [ ] All pages accessible
- [ ] No console errors

### 7.2 Backend Checklist

- [ ] Functions are listed in Netlify dashboard
- [ ] Functions can be invoked
- [ ] Stripe webhook receives events
- [ ] No function errors in logs

### 7.3 Database Checklist

- [ ] Supabase connection works
- [ ] Data can be read/written
- [ ] RLS policies are working
- [ ] User profiles created correctly

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module 'stripe'"**
- ✅ Fixed: Added `stripe` package to `package.json`
- Solution: Run `npm install` and redeploy

**Error: "Missing environment variables"**
- Check: All `VITE_*` variables are set
- Check: Variable names are exact (case-sensitive)
- Solution: Add missing variables and redeploy

### Functions Don't Work

**Error: "Function not found"**
- Check: Functions are in `netlify/functions/` directory
- Check: `netlify.toml` has `functions = "netlify/functions"`
- Solution: Verify file structure and redeploy

**Error: "Cannot find module" in function**
- Check: Dependencies are in root `package.json`
- Check: Function uses correct `require()` statements
- Solution: Ensure all function dependencies are listed

### Environment Variables Not Working

**Frontend can't access variables**
- Check: Variables start with `VITE_`
- Check: Redeployed after adding variables
- Solution: Clear cache and redeploy

**Functions can't access variables**
- Check: Variables don't have `VITE_` prefix
- Check: Variables are set in Netlify dashboard
- Solution: Verify variable names match function code

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#netlify)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
- [Environment Variables Guide](./NETLIFY_ENV_VARIABLES.md)

---

## 🎉 Success!

If everything is working:
- ✅ Your site is live at `https://your-site.netlify.app`
- ✅ Functions are accessible at `/.netlify/functions/function-name`
- ✅ Stripe webhooks are configured
- ✅ Users can sign up and use the app

**Next Steps:**
- Set up custom domain (optional)
- Configure CDN settings
- Set up monitoring and alerts
- Test all features thoroughly

---

## 📞 Need Help?

If you encounter issues:
1. Check build logs in Netlify dashboard
2. Check function logs
3. Check browser console
4. Review `NETLIFY_DEPLOYMENT_REVIEW.md` for common issues
5. Verify all environment variables are set correctly

