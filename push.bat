@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "polish: comparador nudge en 6 product pages, og:image en financiacion+visualizador, galleries en duette+gemini+roller, diversificar thumbnails blog, producto.html main section + H1"
git push
pause
