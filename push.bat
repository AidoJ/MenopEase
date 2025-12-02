@echo off
echo ========================================
echo Pushing MenoTrak to GitHub
echo ========================================
echo.

echo Step 1: Initializing git...
git init
echo.

echo Step 2: Adding files...
git add .
echo.

echo Step 3: Checking status...
git status
echo.

echo Step 4: Committing files...
git commit -m "Initial project structure: React + Vite setup with Supabase, Netlify, EmailJS, Twilio, and Stripe integration"
echo.

echo Step 5: Setting up remote...
git remote remove origin 2>nul
git remote add origin https://github.com/AidoJ/MenopEase.git
git branch -M main
echo.

echo Step 6: Pushing to GitHub...
echo NOTE: You may need to authenticate with GitHub
git push -u origin main
echo.

echo ========================================
echo Done! Check https://github.com/AidoJ/MenopEase
echo ========================================
pause

