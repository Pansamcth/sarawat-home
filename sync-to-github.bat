@echo off
chcp 65001 > nul
echo ========================================================
echo   🚀 SARAWAT - AUTO SYNC WORKSPACE TO GITHUB (MAIN)
echo ========================================================
echo.

cd /d "F:\MP"

:: 1. ตรวจสอบ Git User
git config user.name > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 👤 กำหนดข้อมูลผู้ใช้ Git เริ่มต้น...
    git config --global user.name "Pansamcth"
    git config --global user.email "rujra.wattanakitpaisal@gmail.com"
)

:: 2. ตรวจสอบว่ามี .git หรือยัง
if not exist ".git" (
    echo [1/4] เริ่มต้น Git Repository ในโฟลเดอร์ F:\MP...
    git init -b main
)

:: 3. ตรวจสอบการตั้งค่า Remote Repository
set CURRENT_URL=
for /f "tokens=*" %%u in ('git remote get-url origin 2^>nul') do set CURRENT_URL=%%u
echo %CURRENT_URL% | findstr /I "<USERNAME> <REPO_NAME>" >nul
if %ERRORLEVEL% equ 0 set CURRENT_URL=

if "%CURRENT_URL%"=="" (
    echo.
    echo ⚠️ ยังไม่ได้ตั้งค่า URL ของ GitHub Repository จริง!
    echo ตัวอย่าง URL: https://github.com/Pansamcth/ชื่อ-repo-ของคุณ.git
    echo.
    set /p REPO_URL="กรุณากรอกหรือวาง GitHub Repository URL ของคุณ: "
    if not "%REPO_URL%"=="" (
        git remote remove origin 2>nul
        git remote add origin %REPO_URL%
    ) else (
        echo ❌ ยกเลิกการทำงาน เนื่องจากไม่ได้ระบุ URL
        pause
        exit /b
    )
) else (
    echo 🔗 เชื่อมต่อกับ: %CURRENT_URL%
)

echo.
echo [2/4] กำลังตรวจสอบและรวบรวมไฟล์ทั้งหมด (เพิ่ม, แก้ไข, และลบไฟล์ส่วนเกิน)...
git add -A

echo.
echo [3/4] กำลังบันทึกสถานะ (Commit)...
git commit -m "Update latest website (%date% %time%)" 2>nul
if %ERRORLEVEL% neq 0 (
    git commit -m "Update latest website" 2>nul
)

echo.
echo [4/4] กำลังผลักข้อมูลขึ้น GitHub ไปยัง branch main...
git branch -M main
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   ✅ อัปโหลดขึ้น GitHub สำเร็จ 100%!
    echo   🎉 Vercel จะเริ่ม Deploy เว็บไซต์เวอร์ชันล่าสุดให้ทันที
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo ⚠️ ยัง Push ไม่ผ่าน (อาจเป็นเพราะบน GitHub มีประวัติไฟล์เก่าอยู่)
    echo กำลังลองบังคับเขียนทับ (--force) เพื่อให้ GitHub เหมือนในเครื่องเป๊ะ 100%...
    echo ========================================================
    git push -u origin main --force
    if %ERRORLEVEL% equ 0 (
        echo.
        echo   ✅ บังคับซิงค์ขึ้น GitHub สำเร็จ 100%!
    ) else (
        echo.
        echo ❌ หากยังไม่ผ่าน กรุณาตรวจสอบสิทธิ์การเข้าถึง GitHub (Login หรือ Token)
    )
)

echo.
pause
