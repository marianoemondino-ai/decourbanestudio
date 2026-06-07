@echo off
cd /d "%~dp0"
echo ============================================ > push-log.txt
echo   Decourban Web — Publicar cambios >> push-log.txt
echo ============================================ >> push-log.txt
echo. >> push-log.txt
echo [1] git add -A >> push-log.txt
git add -A >> push-log.txt 2>&1
echo [2] git commit >> push-log.txt
git commit -m "feat: exterior section + AI images + SEO improvements" >> push-log.txt 2>&1
echo. >> push-log.txt
echo [3] git push >> push-log.txt
git push >> push-log.txt 2>&1
echo. >> push-log.txt
echo [LISTO] >> push-log.txt
echo Proceso completado. Ver push-log.txt >> push-log.txt
