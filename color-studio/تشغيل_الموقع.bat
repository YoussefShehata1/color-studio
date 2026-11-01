@echo off
title MF.COLOR Server
echo ====================================
echo   MF.COLOR - جاري تشغيل الموقع...
echo ====================================
start http://localhost:5173/
py -m http.server 5173
pause
