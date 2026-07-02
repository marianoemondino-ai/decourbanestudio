# Descarga todas las imagenes de Hunter Douglas al proyecto local
# Ejecutar desde la carpeta decourban-web: powershell -ExecutionPolicy Bypass -File descargar-imagenes-hd.ps1

$imgDir = Join-Path $PSScriptRoot "img\hd"
if (-not (Test-Path $imgDir)) {
    New-Item -ItemType Directory -Path $imgDir -Force | Out-Null
    Write-Host "Carpeta creada: $imgDir"
}

$headers = @{
    "Referer"    = "https://www.hunterdouglas.com.ar/"
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36"
}

$images = @(
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/HD.Cortina-Silhouette-5-1024x677.jpg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/Hunter-Douglas.Paneles-Orientales-living.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/HunterDouglas-white-logo3-03.svg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/X9A7814-scaled-qucqr83sz3rgxtup48ewldx68rc4apcil2w1us5j8y.jpg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/folding-pergola-hunter-douglas-grandes-dimensoes.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/inovacao-001.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/stobag_cobertura_modular.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/toldo-proyectante-hunter-douglasjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/11/cortinas-luminette-para-hall.8b48cd-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/11/etapa-3-toldo-green-hunter-douglas-1.jpg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/11/toldo-gemini-autoportante.375994-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/12/cortinas-roller-shadesign-living-clasico-hunterdouglas.17bb53-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2025/12/toldo-proyectante-negro-jardinjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/02/cortinas-verticales-screenjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/02/horizontales-de-maderajpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/03/HUNTER-DOUGLAS-EXPERIENCIA-LIVING-by-RITVU-185.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/Cortina-Luminette-Hunter-Douglas.jpeg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/LeticiaRocco_ExperienciaLiving2026_Foto@ritvu_Silhouette_01.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/PersianaAluminio_37.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/SandyCairncross_ExperienciaLiving2026_Foto@ritvu_CountryWoods_Duette_02.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/cortina-luminette-3.jpg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/cortina-silhouette-11.jpg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/persiana-metais-preciosos-jogo-de-luz-scaled-1.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/primeira-persiana-de-aluminio-hunter-douglas.jpg",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/stobag_campo_pergolado.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/cortinas-twinline-negrasjpg-optimized-2.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/pergolas-autoportantepng-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/toldo-zip-ledjpg-optimized-1.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/toldo-zip-ledjpg-optimized-2.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-duette-detalle-tela-hunter-douglas-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-duette-hunter-douglas_4-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-pirouette-detalle-tela-hunter-douglas-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-pirouette-estudiopng-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-roller-shadesign-infantilesjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-roller-superior-living-hunterdouglasjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-silhouette-detalle-tela-hunter-douglas-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-silhouette-hunter-douglas_7-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-twinline-living-hunter-douglasjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-verticales-para-living-hunterdouglasjpg-optimized.webp",
    "https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/ettes-cortinas-pirouette-hunter-douglas-optimized.webp"
)

$ok = 0
$fail = 0

foreach ($url in $images) {
    $filename = [System.IO.Path]::GetFileName($url)
    $dest = Join-Path $imgDir $filename

    if (Test-Path $dest) {
        Write-Host "  Ya existe: $filename" -ForegroundColor DarkGray
        $ok++
        continue
    }

    try {
        Invoke-WebRequest -Uri $url -Headers $headers -OutFile $dest -UseBasicParsing -TimeoutSec 30
        $size = (Get-Item $dest).Length
        Write-Host "  OK ($([math]::Round($size/1024))KB): $filename" -ForegroundColor Green
        $ok++
    } catch {
        Write-Host "  ERROR: $filename - $($_.Exception.Message)" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "=== Listo: $ok OK, $fail errores ===" -ForegroundColor Cyan
Write-Host "Ahora ejecuta fix-and-push.bat para subir todo a Vercel."
pause
