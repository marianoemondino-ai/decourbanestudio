#!/usr/bin/env python3
"""
Descarga todas las imágenes CDN de hunterdouglas.com.ar y actualiza los HTML.

El CDN de HD bloquea imágenes cuando se carga desde otro dominio (hotlink protection).
Este script descarga las imágenes localmente y actualiza los HTML para usar rutas locales.

Uso:
    python descargar-imagenes-hd.py

Requiere: pip install requests
"""

import os
import re
import sys
import time
import hashlib
import urllib.parse
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: Falta el módulo 'requests'.")
    print("Instalar con:  pip install requests")
    sys.exit(1)

# ── Configuración ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent          # Carpeta raíz del proyecto (decourban-web)
IMG_DIR  = BASE_DIR / "img" / "hunter"   # Destino de imágenes descargadas
IMG_DIR.mkdir(parents=True, exist_ok=True)

HD_CDN_BASE = "https://www.hunterdouglas.com.ar/wp-content/uploads/"

# Headers que imitan Chrome navegando en hunterdouglas.com.ar
# El Referer es lo que evita el bloqueo hotlink
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.hunterdouglas.com.ar/",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "same-origin",
}

HTML_FILES = [
    "duette.html",
    "silhouette.html",
    "pirouette.html",
    "luminette.html",
    "twinline.html",
    "roller.html",
    "shadesign.html",
    "tradicionales.html",
    "persiana-aluminio.html",
    "persiana-madera.html",
    "persiana-vertical.html",
    "isla-alumina.html",
    "isla-romana.html",
    "folding-pergola.html",
]

# ── Funciones ──────────────────────────────────────────────────────────────────

def find_cdn_urls(html: str) -> list[str]:
    """Encuentra todas las URLs del CDN de HD en el HTML."""
    pattern = r'https://www\.hunterdouglas\.com\.ar/wp-content/uploads/[^\s\'")\]>]+'
    urls = re.findall(pattern, html)
    # Limpiar caracteres colgantes
    cleaned = []
    for url in urls:
        url = url.rstrip(".,;:!?)'\"]")
        if url not in cleaned:
            cleaned.append(url)
    return cleaned


def url_to_local_path(url: str) -> Path:
    """
    Convierte una URL CDN a una ruta local dentro de img/hunter/.
    Conserva el nombre de archivo original para fácil identificación.
    """
    parsed = urllib.parse.urlparse(url)
    # parsed.path = /wp-content/uploads/2025/10/imagen.jpg
    # Tomamos solo el nombre de archivo
    filename = Path(parsed.path).name

    # Si hay query string (ej: ?resize=300,200), agregar hash corto para unicidad
    if parsed.query:
        suffix = hashlib.md5(parsed.query.encode()).hexdigest()[:6]
        stem = Path(filename).stem
        ext  = Path(filename).suffix
        filename = f"{stem}_{suffix}{ext}"

    return IMG_DIR / filename


def download_image(url: str, dest: Path, session: requests.Session) -> bool:
    """Descarga una imagen y la guarda en dest. Retorna True si tuvo éxito."""
    if dest.exists() and dest.stat().st_size > 500:
        print(f"  ✓ Ya existe: {dest.name}")
        return True

    try:
        resp = session.get(url, headers=HEADERS, timeout=30, stream=True)
        if resp.status_code == 200:
            content_type = resp.headers.get("Content-Type", "")
            if "text/html" in content_type:
                print(f"  ✗ Bloqueada (devuelve HTML): {url}")
                return False
            with open(dest, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            size_kb = dest.stat().st_size // 1024
            print(f"  ↓ Descargada ({size_kb} KB): {dest.name}")
            return True
        else:
            print(f"  ✗ Error {resp.status_code}: {url}")
            return False
    except requests.RequestException as e:
        print(f"  ✗ Excepción: {e}")
        return False


def process_html_file(html_path: Path, url_map: dict[str, str]) -> int:
    """
    Reemplaza URLs CDN por rutas locales en el HTML.
    Retorna el número de reemplazos realizados.
    """
    text = html_path.read_text(encoding="utf-8")
    replacements = 0

    for cdn_url, local_path in url_map.items():
        if cdn_url in text:
            text = text.replace(cdn_url, local_path)
            replacements += 1

    if replacements > 0:
        html_path.write_text(text, encoding="utf-8")

    return replacements


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Descargador de imágenes Hunter Douglas")
    print("=" * 60)
    print(f"  Destino: {IMG_DIR}")
    print()

    # 1. Recolectar TODAS las URLs únicas de todos los HTML
    all_urls: list[str] = []
    for name in HTML_FILES:
        path = BASE_DIR / name
        if not path.exists():
            print(f"[!] No encontrado: {name}")
            continue
        text = path.read_text(encoding="utf-8")
        urls = find_cdn_urls(text)
        for u in urls:
            if u not in all_urls:
                all_urls.append(u)

    if not all_urls:
        print("No se encontraron URLs CDN de Hunter Douglas. ¡Nada que hacer!")
        return

    print(f"[1] URLs CDN encontradas: {len(all_urls)}")
    print()

    # 2. Descargar imágenes
    print("[2] Descargando imágenes...")
    session = requests.Session()
    url_map: dict[str, str] = {}   # cdn_url → ruta local relativa para HTML
    failed: list[str] = []

    for i, url in enumerate(all_urls, 1):
        dest = url_to_local_path(url)
        print(f"  [{i}/{len(all_urls)}] {Path(url).name}")
        ok = download_image(url, dest, session)
        if ok:
            # Ruta relativa como la usaría el HTML: /img/hunter/filename.ext
            local_ref = "/img/hunter/" + dest.name
            url_map[url] = local_ref
        else:
            failed.append(url)
        # Pausa breve para no saturar el servidor
        time.sleep(0.3)

    print()
    print(f"  Descargadas: {len(url_map)}")
    print(f"  Fallidas:    {len(failed)}")
    if failed:
        print()
        print("  URLs que fallaron:")
        for u in failed:
            print(f"    {u}")
    print()

    if not url_map:
        print("[!] No se descargó ninguna imagen. Abortando actualización de HTML.")
        return

    # 3. Actualizar HTML files
    print("[3] Actualizando archivos HTML...")
    total_replacements = 0
    for name in HTML_FILES:
        path = BASE_DIR / name
        if not path.exists():
            continue
        n = process_html_file(path, url_map)
        if n > 0:
            print(f"  ✓ {name}: {n} reemplazos")
            total_replacements += n
        else:
            print(f"  - {name}: sin cambios")

    print()
    print("=" * 60)
    print(f"  Listo. {total_replacements} URLs reemplazadas en los HTML.")
    if failed:
        print(f"  Atención: {len(failed)} imágenes no se pudieron descargar.")
        print("  Para esas imágenes quedan las URLs CDN originales (pueden no verse).")
    print()
    print("  Siguiente paso: ejecutar push-rebrand.bat para publicar en Vercel.")
    print("=" * 60)


if __name__ == "__main__":
    main()
