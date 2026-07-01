@echo off
echo Pusheando cambios a Vercel...
cd /d "%~dp0"

:: Limpiar locks y posible corrupcion del indice git
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\MERGE_HEAD" del /f ".git\MERGE_HEAD"

:: Reparar indice corrupto
echo Verificando indice git...
git status >nul 2>&1
if errorlevel 128 (
  echo Indice corrupto detectado - reparando...
  del /f ".git\index" 2>nul
  git reset HEAD 2>nul
  echo Indice reparado.
)

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

git commit -m "fix: logo1.jpg como logo-du.webp local en navbar + vajillero chicago largo + estructura index"

git push origin main

echo.
echo Listo! Vercel desplegando en 1-2 minutos...
pause
