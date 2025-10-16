@echo off
echo ========================================
echo    Department Assignment Fix Script
echo ========================================
echo.
echo This script will fix department assignments for your law firm data.
echo It will assign unassigned cases and users to appropriate departments.
echo.
echo Before running, make sure:
echo 1. Your server is not running (to avoid conflicts)
echo 2. You have a backup of your database (recommended)
echo 3. Your .env file has the correct MONGO_URI
echo.
pause
echo.
echo Starting department assignment fix...
echo.
cd server
node fix_department_assignments.js
echo.
echo Department assignment fix completed!
echo Please check the output above for any issues.
echo.
pause
