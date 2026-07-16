@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   Descargador de imagenes Hunter Douglas
echo ============================================================
echo.

:: Verificar que Python esté instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado o no esta en el PATH.
    echo Instalar Python desde https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Instalar requests si falta
echo Verificando dependencias...
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo Instalando 'requests'...
    pip install requests --quiet
)

echo.

:: Ir a la carpeta del script
cd /d "%~dp0"

:: Ejecutar el script
python descargar-imagenes-hd.py

echo.
pause
