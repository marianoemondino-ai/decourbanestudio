@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "feat: guia precios HD, garantia, blog oficina, testimonios, herramientas homepage, sitemap 28 URLs"
git push
pause
