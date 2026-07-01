@echo off
echo Limpiando archivos sin usar...
cd /d "%~dp0"

:: Scripts viejos
del /f "push.bat" "push-to-vercel.bat" "push-cambios.bat" "mover_imagenes.bat" "push-log.txt" 2>nul

:: Logo fuente / duplicados
del /f "logo1.jpg" 2>nul
del /f "img\logo DU.jpeg" 2>nul
del /f "img\logo-du.png" 2>nul
del /f "img\logo-du.svg" 2>nul

:: Backups
del /f "img\catalogo\silla_ginger_backup.webp" 2>nul
del /f "img\catalogo\silla_thom_ratan_backup.webp" 2>nul

:: Sillas sin usar (silla_p01 a silla_p14)
del /f "img\catalogo\silla_p01_img01.webp" "img\catalogo\silla_p02_img01.webp" "img\catalogo\silla_p03_img01.webp" "img\catalogo\silla_p04_img01.webp" "img\catalogo\silla_p05_img01.webp" "img\catalogo\silla_p06_img01.webp" "img\catalogo\silla_p07_img01.webp" 2>nul
del /f "img\catalogo\silla_p08_img01.webp" "img\catalogo\silla_p09_img01.webp" "img\catalogo\silla_p10_img01.webp" "img\catalogo\silla_p11_img01.webp" "img\catalogo\silla_p12_img01.webp" "img\catalogo\silla_p13_img01.webp" "img\catalogo\silla_p14_img01.webp" 2>nul

:: Sofás sin usar (sofa_p02 a sofa_p11)
del /f "img\catalogo\sofa_p02_img01.webp" "img\catalogo\sofa_p03_img01.webp" "img\catalogo\sofa_p04_img01.webp" "img\catalogo\sofa_p05_img01.webp" "img\catalogo\sofa_p06_img01.webp" 2>nul
del /f "img\catalogo\sofa_p07_img01.webp" "img\catalogo\sofa_p08_img01.webp" "img\catalogo\sofa_p09_img01.webp" "img\catalogo\sofa_p10_img01.webp" "img\catalogo\sofa_p11_img01.webp" 2>nul

:: Alfombras (no están en el catálogo)
del /f "img\catalogo\alfombra_kilim.webp" "img\catalogo\alfombra_kiram.webp" "img\catalogo\alfombra_yute_algodon.webp" "img\catalogo\alfombra_yute_franjas.webp" "img\catalogo\alfombra_yute_tejido.webp" 2>nul

:: Otros sin usar
del /f "img\catalogo\butaca_07.webp" "img\catalogo\puff_jacinto.webp" "img\catalogo\sillon_fenix.webp" "img\catalogo\sillon_kenzo.webp" 2>nul
del /f "img\catalogo\mesa_asimetrica.webp" "img\catalogo\mesa_oval_escandinava.webp" "img\catalogo\mesa_oval_nogal.webp" "img\catalogo\mesa_redonda_grafito.webp" 2>nul
del /f "img\hd-logo-white.svg" 2>nul
del /f "img\index-dormitorio.webp" "img\index-silhouette.webp" "img\index-terraza.webp" 2>nul

echo.
echo Listo. Ahora podes correr fix-and-push.bat para subir los cambios.
pause
