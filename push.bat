@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "polish: fix img duplicates sitewide, producto.html main section + H1, blog rel-art thumbnails diversificados"
git push
pause
