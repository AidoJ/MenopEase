# Script to push MenoTrak to GitHub
Write-Host "Starting git operations..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Configure git user (if not already set)
Write-Host "Configuring git user..." -ForegroundColor Yellow
git config user.name "AidoJ"
git config user.email "aidoj@users.noreply.github.com"

# Add all files
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host "`nFiles to be committed:" -ForegroundColor Cyan
git status --short

# Commit
Write-Host "`nCommitting files..." -ForegroundColor Yellow
git commit -m "Initial project structure: React + Vite setup with Supabase, Netlify, EmailJS, Twilio, and Stripe integration"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful!" -ForegroundColor Green
} else {
    Write-Host "Commit failed or nothing to commit" -ForegroundColor Red
    exit 1
}

# Set up remote
Write-Host "`nSetting up remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/AidoJ/MenopEase.git
git branch -M main

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: You may need to authenticate with GitHub" -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/AidoJ/MenopEase" -ForegroundColor Cyan
} else {
    Write-Host "`nPush failed. You may need to:" -ForegroundColor Red
    Write-Host "1. Authenticate with GitHub (use GitHub CLI or Personal Access Token)" -ForegroundColor Yellow
    Write-Host "2. Check your internet connection" -ForegroundColor Yellow
    Write-Host "3. Verify repository permissions" -ForegroundColor Yellow
}

