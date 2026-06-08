@echo off
cd "C:\Users\User\decourban-web"
if exist ".git\index.lock" del ".git\index.lock"
if exist ".git\HEAD.lock" del ".git\HEAD.lock"
git add -A
git commit -m "fix: logo 64px nav 84px, quitar width height hardcodeado en 30 archivos, padding heroes, footer logo 52px"
git push
pause
