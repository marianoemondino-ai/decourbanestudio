@echo off
echo Pusheando cambios a Vercel...
cd /d "%~dp0"

:: Limpiar locks y posible corrupcion del indice git
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\MERGE_HEAD" del /f ".git\MERGE_HEAD"

git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999

:: Agregar todos los cambios
git add -A

:: Mostrar estado
echo.
echo --- Archivos a commitear ---
git status --short
echo ----------------------------
echo.

git commit -m "fix: logo HD en nav de todas las paginas, 4 mesas removidas, aspect-ratio imagenes cuadradas"

git push origin main

echo.
echo Listo! Vercel desplegando en 1-2 minutos...
pause
