@echo off
setlocal enabledelayedexpansion
title SARAWAT - Auto Sync to GitHub

cd /d "%~dp0"
echo ========================================================
echo   SARAWAT - AUTO SYNC WORKSPACE TO GITHUB (MAIN)
echo ========================================================
echo.

:: 1. Check Git user
git config user.name >nul 2>&1
if errorlevel 1 (
    git config --global user.name "Pansamcth"
    git config --global user.email "rujira.wattanakitpaisal@gmail.com"
)

:: 2. Check Remote URL
set "CURRENT_URL="
for /f "tokens=*" %%u in ('git remote get-url origin 2^>nul') do set "CURRENT_URL=%%u"

if "!CURRENT_URL!"=="" goto ASK_URL
echo "!CURRENT_URL!" | findstr /I "USERNAME REPO_NAME" >nul
if not errorlevel 1 goto ASK_URL
goto HAS_URL

:ASK_URL
echo [!] Please enter your GitHub Repository URL.
echo Example: https://github.com/Pansamcth/your-repo-name.git
echo.
set /p "REPO_URL=Enter or Paste GitHub URL: "
if "!REPO_URL!"=="" (
    echo [ERROR] No URL provided. Aborting.
    pause
    exit /b 1
)
git remote remove origin 2>nul
git remote add origin !REPO_URL!
set "CURRENT_URL=!REPO_URL!"

:HAS_URL
echo [OK] Connected to: !CURRENT_URL!
echo.
echo [1/3] Adding all files (syncing additions, modifications, deletions)...
git add -A

echo [2/3] Committing changes...
git commit -m "Update latest website (%date% %time%)" 2>nul
if errorlevel 1 git commit -m "Update latest website" 2>nul

echo [3/3] Pushing to GitHub main branch...
git branch -M main
git push -u origin main
if errorlevel 1 (
    echo.
    echo [WARNING] Normal push failed. Attempting force sync...
    git push -u origin main --force
)

if not errorlevel 1 (
    echo.
    echo ========================================================
    echo   [SUCCESS] Successfully synced to GitHub main branch!
    echo   Vercel deployment will start automatically.
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. Please check your GitHub credentials or repository URL.
)

echo.
pause
