@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0descargar-imagenes-hd.ps1"
if errorlevel 1 (
  echo.
  echo ERROR: algo salio mal. Ver mensaje arriba.
)
pause
