@echo off
cd "C:\Users\User\decourban-web"
if exist ".git\index.lock" del ".git\index.lock"
if exist ".git\HEAD.lock" del ".git\HEAD.lock"
git add -A
git commit -m "fix: CSS braces+duplicados, JS getElementById nav/mobNav en 17 archivos, BOM en 7 archivos, noopener, meta desc"
git push
pause
