@echo off
cd /d "C:\Users\User\decourban-web"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "fix: mobile nav all pages, image dedup, grammar voseo, sitemap fixed, privacidad mobile"
git push
pause
