@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "fix: boton WhatsApp flotante en index, JS completo, visualizador mejorado"
git push
pause
