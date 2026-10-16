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
    echo 👤 ยังไม่ได้ตั้งค่าชื่อผู้ใช้สำหรับ Git
    set /p GIT_NAME="กรุณากรอกชื่อหรือ GitHub Username: "
    set /p GIT_EMAIL="กรุณากรอกอีเมล GitHub: "
    if not "%GIT_NAME%"=="" git config --global user.name "%GIT_NAME%"
    if not "%GIT_EMAIL%"=="" git config --global user.email "%GIT_EMAIL%"
    echo.
)

:: 2. ตรวจสอบว่ามี .git หรือยัง
if not exist ".git" (
    echo [1/4] เริ่มต้น Git Repository ในโฟลเดอร์ F:\MP...
    git init -b main
)

:: 3. ตรวจสอบการตั้งค่า Remote Repository
git remote get-url origin > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ⚠️ ยังไม่ได้เชื่อมต่อกับ GitHub Repository!
    echo ตัวอย่าง URL: https://github.com/USERNAME/REPO_NAME.git
    set /p REPO_URL="กรุณากรอก GitHub Repository URL ของคุณ: "
    if not "%REPO_URL%"=="" (
        git remote add origin %REPO_URL%
    ) else (
        echo ❌ ยกเลิกการทำงาน เนื่องจากไม่ได้ใส่ URL
        pause
        exit /b
    )
)

echo.
echo [2/4] กำลังตรวจสอบและรวบรวมไฟล์ทั้งหมด (เพิ่ม, แก้ไข, และลบไฟล์ส่วนเกิน)...
git add -A

echo.
echo [3/4] กำลังบันทึกสถานะ (Commit)...
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set mydate=%%a-%%b-%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
git commit -m "Update website: %mydate% %mytime%"

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
    echo ⚠️ เกิดข้อผิดพลาดในการ Push หรือติดสิทธิ์การเข้าถึง
    echo หากบน GitHub มีประวัติเก่าที่ต้องการแทนที่ด้วยเครื่องนี้ทั้งหมด
    echo สามารถพิมพ์คำสั่ง: git push -u origin main --force
)

echo.
pause
