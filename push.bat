@echo off
cd "C:\Users\User\decourban-web"
if exist ".git\index.lock" del ".git\index.lock"
if exist ".git\HEAD.lock" del ".git\HEAD.lock"
git add -A
git commit -m "fix: reemplazar 9 URLs CDN fabricadas, quitar video thumbnails de img tags, limpiar null bytes en 3 archivos"
git push
pause
