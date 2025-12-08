# Netlify Deployment Review & Fix Guide

## 🔍 Current Status Review

### ✅ What's Working
- Vite build configuration is correct (`dist` output)
- `netlify.toml` has basic build settings
- React app structure is properly organized
- Functions are in the correct location (`netlify/functions/`)

### ❌ Critical Issues Preventing Deployment

#### 1. **Missing Server-Side Stripe Package**
- **Problem**: Functions use `require('stripe')` but package.json only has client-side Stripe packages
- **Impact**: Functions will fail at runtime with "Cannot find module 'stripe'"
- **Fix**: Add `stripe` package to dependencies

#### 2. **Package.json Module Type Conflict**
- **Problem**: Root `package.json` has `"type": "module"` (ES modules) but functions use CommonJS (`require`)
- **Impact**: Functions may not work correctly
- **Fix**: Functions can still use CommonJS even if root is ES modules, but we need to ensure dependencies are available

#### 3. **Netlify Functions Configuration**
- **Problem**: Functions directory path not explicitly set in `netlify.toml`
- **Impact**: Netlify might not find functions correctly
- **Fix**: Add explicit functions directory configuration

#### 4. **Missing Function Dependencies**
- **Problem**: Functions need `stripe`, `@supabase/supabase-js`, `@emailjs/nodejs`, `twilio` but these may not be bundled correctly
- **Impact**: Functions will fail at runtime
- **Fix**: Ensure all function dependencies are in package.json

#### 5. **Environment Variables**
- **Problem**: Functions use different env var names than frontend (e.g., `SUPABASE_URL` vs `VITE_SUPABASE_URL`)
- **Impact**: Functions won't connect to Supabase
- **Fix**: Document required env vars and ensure consistency

## 🛠️ Required Fixes

### Fix 1: Add Missing Dependencies to package.json
```json
"dependencies": {
  ...
  "stripe": "^14.0.0"  // Server-side Stripe package
}
```

### Fix 2: Update netlify.toml
- Add explicit functions directory
- Ensure build settings are correct
- Add function-specific environment variable documentation

### Fix 3: Create Functions package.json (Optional but Recommended)
- Create `netlify/functions/package.json` with function-specific dependencies
- This ensures functions have their own isolated dependencies

### Fix 4: Environment Variables Documentation
- Document all required env vars for Netlify dashboard
- Separate frontend (VITE_*) from backend function env vars

## 📋 Next Steps

1. ✅ Fix package.json - add `stripe` package
2. ✅ Update netlify.toml with proper configuration
3. ✅ Create comprehensive environment variables guide
4. ✅ Test build locally
5. ✅ Deploy to Netlify

## 🚀 Deployment Checklist

### Before Deploying:
- [ ] All dependencies installed (`npm install`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables set in Netlify dashboard
- [ ] Functions tested locally (if possible)
- [ ] netlify.toml configured correctly

### Netlify Dashboard Setup:
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add all environment variables
- [ ] Configure function environment variables separately

### Environment Variables Required:

#### Frontend (VITE_* - available in browser):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_EMAILJS_TEMPLATE_ID_WELCOME`
- `VITE_EMAILJS_TEMPLATE_ID_SUMMARY`
- `VITE_EMAILJS_TEMPLATE_ID_REPORT`
- `VITE_WEATHER_API_KEY`
- `VITE_APP_URL`

#### Backend Functions (NOT VITE_* - server-side only):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL` (same as VITE_SUPABASE_URL but without VITE_ prefix)
- `SUPABASE_SERVICE_ROLE_KEY` (different from anon key - has admin access)
- `EMAILJS_SERVICE_ID` (same as VITE_EMAILJS_SERVICE_ID)
- `EMAILJS_PUBLIC_KEY` (same as VITE_EMAILJS_PUBLIC_KEY)
- `EMAILJS_TEMPLATE_WELCOME`
- `EMAILJS_TEMPLATE_UPGRADE`
- `EMAILJS_TEMPLATE_DOWNGRADE`
- `EMAILJS_TEMPLATE_CANCELLED`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## ⚠️ Important Notes

1. **VITE_ Prefix**: Only variables prefixed with `VITE_` are available in the browser. Server-side functions should use non-prefixed versions.

2. **Service Role Key**: Functions need `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to bypass RLS policies.

3. **Stripe Keys**: 
   - Frontend uses `VITE_STRIPE_PUBLISHABLE_KEY` (public)
   - Functions use `STRIPE_SECRET_KEY` (secret, never expose to browser)

4. **Function Testing**: Test functions locally using Netlify CLI before deploying.

## 🔧 Implementation

See the fixes applied in:
- `package.json` - Added missing dependencies
- `netlify.toml` - Updated configuration
- `NETLIFY_ENV_VARIABLES.md` - Complete environment variables guide

