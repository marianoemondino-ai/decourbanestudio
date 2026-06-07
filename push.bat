@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "perf: fonts async, preconnect CDN, loader max 2s, logo original colors 96px"
git push
pause
