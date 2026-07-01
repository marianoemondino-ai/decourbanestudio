@echo off
echo Pusheando cambios a Vercel...
cd /d "%~dp0"

:: Limpiar lock de git si existe
if exist ".git\index.lock" del /f ".git\index.lock"

git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999

git add styles.css index.html catalogo.html servicios.html proyectos.html nosotros.html contacto.html hunterdouglas.html sitemap.xml robots.txt 404.html privacidad.html galeria.html img/

git commit -m "feat: servicios integrado en inicio, nav reducido, HD hero con logo y foto"

git push origin main

echo.
echo Listo! Cambios enviados a Vercel.
pause
