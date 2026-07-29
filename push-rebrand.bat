@echo off
echo ============================================
echo  Decourban - Push a GitHub/Vercel
echo ============================================
cd /d "%~dp0"

:: Limpiar log anterior
echo === PUSH %DATE% %TIME% === > "%~dp0push-log.txt"

:: Borrar locks que Cowork recrea constantemente
if exist ".git\index.lock" del /f /q ".git\index.lock" >> "%~dp0push-log.txt" 2>&1
if exist ".git\HEAD.lock"  del /f /q ".git\HEAD.lock"  >> "%~dp0push-log.txt" 2>&1
if exist ".git\COMMIT_EDITMSG.lock" del /f /q ".git\COMMIT_EDITMSG.lock" >> "%~dp0push-log.txt" 2>&1

:: Usar un index temporal para evitar conflictos con Cowork
set GIT_INDEX_FILE=%TEMP%\du-git-idx-tmp
if exist "%GIT_INDEX_FILE%" del /f /q "%GIT_INDEX_FILE%"

echo Paso 1: Leyendo HEAD en index temporal...
git read-tree HEAD >> "%~dp0push-log.txt" 2>&1
if errorlevel 1 (
  echo ERROR en read-tree. Intentando alternativa...
  echo ERROR en read-tree >> "%~dp0push-log.txt"
  :: Intentar sin index temporal
  set GIT_INDEX_FILE=
  del /f /q ".git\index.lock" 2>nul
  git add -A >> "%~dp0push-log.txt" 2>&1
  git commit -m "update decourban web %DATE% %TIME%" >> "%~dp0push-log.txt" 2>&1
  git push origin main >> "%~dp0push-log.txt" 2>&1
  goto CHECKPUSH
)

echo Paso 2: Agregando todos los cambios...
git add -A >> "%~dp0push-log.txt" 2>&1

echo Paso 3: Commiteando...
git commit -m "update decourban web %DATE% %TIME%" >> "%~dp0push-log.txt" 2>&1
:: (no falla si no hay nada nuevo, continua al push)

echo Paso 4: Pusheando a GitHub...
git push --force origin main >> "%~dp0push-log.txt" 2>&1

:CHECKPUSH
if errorlevel 1 goto ERROR_PUSH

del /f "%GIT_INDEX_FILE%" 2>nul
echo.
echo ============================================
echo  LISTO - Vercel desplegando en 1-2 minutos
echo  https://decourbanestudio.vercel.app/
echo ============================================
echo.
echo Contenido del log:
type "%~dp0push-log.txt"
goto FIN

:ERROR_PUSH
echo.
echo ERROR en el push. Contenido del log:
type "%~dp0push-log.txt"

:FIN
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
