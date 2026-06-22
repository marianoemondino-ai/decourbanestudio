@echo off
echo Pusheando mejoras completas a Vercel...
cd /d "%~dp0"
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999
git add styles.css index.html catalogo.html servicios.html proyectos.html nosotros.html contacto.html sitemap.xml robots.txt 404.html privacidad.html galeria.html img/
git commit -m "fix: logo más grande, case-study aspect-ratio 4/3 para fotos landscape, img/ incluido en deploy"
git push origin main
echo.
echo Listo! Vercel deploya en ~1 minuto.
pause
