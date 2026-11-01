@echo off
title MF.COLOR Server
echo Starting MF.COLOR...
start http://localhost:5173/
py -m http.server 5173
pause
