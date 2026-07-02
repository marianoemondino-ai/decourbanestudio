@echo off
echo Extrayendo imagenes HD...
powershell -Command "Expand-Archive -Path '%USERPROFILE%\Downloads\hd-images.zip' -DestinationPath '%~dp0img\hd\' -Force; Write-Host 'Listo!'"
echo.
echo Imagenes extraidas a img\hd\
echo Ahora ejecuta fix-and-push.bat para subir a Vercel.
pause
