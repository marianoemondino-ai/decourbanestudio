@echo off
echo ============================================
echo  Push rebrand Decourban - indice temporal
echo ============================================
cd /d "%~dp0"

:: Usar indice temporal fuera de .git/ para evitar el lock de Cowork
set GIT_INDEX_FILE=%TEMP%\decourban-git-index-tmp

:: Limpiar indice temporal anterior si existe
if exist "%GIT_INDEX_FILE%" del /f "%GIT_INDEX_FILE%"

:: Leer el estado actual del HEAD en el indice temporal
echo Preparando indice...
git read-tree HEAD
if errorlevel 1 (
  echo ERROR al leer HEAD. Abortando.
  pause
  exit /b 1
)

:: Agregar todos los cambios del disco al indice temporal
echo Agregando cambios...
git add -A
if errorlevel 1 (
  echo ERROR en git add. Abortando.
  pause
  exit /b 1
)

:: Mostrar que se va a commitear
echo.
echo --- Archivos a commitear ---
git status --short
echo ----------------------------
echo.

:: Commitear
git commit -m "feat+fix: nuevo logo nav, foto duena, tipografia Outfit, copy rebrand, fix overflow movil + fix HTML truncado en nosotros/index/servicios"
if errorlevel 1 (
  echo Nada nuevo para commitear o error en commit.
  pause
  exit /b 1
)

:: Pushear
echo Pusheando a GitHub...
git push origin main
if errorlevel 1 (
  echo ERROR en push. Verificar credenciales de GitHub.
  pause
  exit /b 1
)

:: Limpiar indice temporal
del /f "%GIT_INDEX_FILE%" 2>nul

echo.
echo Listo! Vercel desplegando en 1-2 minutos...
echo Verificar en: https://decourbanestudio.vercel.app/
pause
