@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "redesign: hero video full-screen, estilo posse minimalista, fonts sistema, nav transparente"
git push
pause
