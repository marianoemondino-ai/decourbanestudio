@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "rebrand: Marcela reemplazada por DecoUrban Studio Staff en 20 paginas"
git push
pause
