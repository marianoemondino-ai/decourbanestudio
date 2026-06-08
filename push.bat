@echo off
cd "C:\Users\User\decourban-web"
if exist ".git\index.lock" del ".git\index.lock"
if exist ".git\HEAD.lock" del ".git\HEAD.lock"
git add -A
git commit -m "fix: --gold #c4a46b, --bg-dark dark, CSS completo nosotros/contacto/exterior, breadcrumb coleccion, robots.txt"
git push
pause
