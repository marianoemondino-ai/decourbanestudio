@echo off
echo Pusheando cambios a Vercel...
cd /d "%~dp0"

:: Limpiar lock de git si existe
if exist ".git\index.lock" del /f ".git\index.lock"

git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999

:: Agregar todos los cambios (HTML, CSS, imagenes, SVG)
git add -A

:: Mostrar estado antes de commitear
echo.
echo --- Estado de los archivos ---
git status --short
echo ------------------------------
echo.

git commit -m "refactor: hunterdouglas.html reducido y logo SVG local"

git push origin main

echo.
echo Listo! Vercel desplegando en 1-2 minutos...
pause
