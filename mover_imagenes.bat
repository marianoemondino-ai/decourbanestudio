@echo off
echo Moviendo imagenes a img\catalogo...
set SRC=%USERPROFILE%\Downloads
set DST=%~dp0img\catalogo

for %%f in (sillon_kenzo puff_jacinto sillon_fenix lampara_camaron lampara_dia pantalla_cesta_mimbre alfombra_kiram alfombra_kilim alfombra_yute_tejido alfombra_yute_algodon alfombra_yute_franjas) do (
  if exist "%SRC%\%%f.webp" (
    copy /Y "%SRC%\%%f.webp" "%DST%\%%f.webp"
    echo OK: %%f.webp
  ) else (
    echo NO ENCONTRADO: %%f.webp
  )
)

echo.
echo Listo!
pause
