@echo off
echo ============================================
echo  Decourban - Push a GitHub/Vercel
echo ============================================
cd /d "%~dp0"

set GIT_INDEX_FILE=%TEMP%\du-git-idx-tmp
if exist "%GIT_INDEX_FILE%" del /f "%GIT_INDEX_FILE%"

echo Paso 1: Preparando indice...
git read-tree HEAD >> "%~dp0push-log.txt" 2>&1
if errorlevel 1 goto ERROR

echo Paso 2: Agregando cambios...
git add -A >> "%~dp0push-log.txt" 2>&1

echo Paso 3: Commiteando...
git commit -m "update decourban web" >> "%~dp0push-log.txt" 2>&1

echo Paso 4: Pusheando...
git push origin main >> "%~dp0push-log.txt" 2>&1
if errorlevel 1 goto ERROR_PUSH

del /f "%GIT_INDEX_FILE%" 2>nul
echo.
echo LISTO - Vercel desplegando en 1-2 minutos
echo https://decourbanestudio.vercel.app/
goto FIN

:ERROR_PUSH
echo.
echo ERROR en el push. Ver push-log.txt para detalles.
goto FIN

:ERROR
echo.
echo ERROR en git. Ver push-log.txt para detalles.

:FIN
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
