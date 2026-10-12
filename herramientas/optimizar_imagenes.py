"""Convierte las fotos originales (fotos-pagina-harmon/) a WebP optimizado en img/.
Uso:  python3 herramientas/optimizar_imagenes.py
Los originales no se tocan. Requiere:  pip install pillow
"""
import glob, os
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "fotos-pagina-harmon")
DEST = os.path.join(RAIZ, "img")
for ruta in sorted(glob.glob(os.path.join(ORIG, "*", "*.jpg"))):
    prod = os.path.basename(os.path.dirname(ruta))
    base = os.path.splitext(os.path.basename(ruta))[0]
    os.makedirs(os.path.join(DEST, prod), exist_ok=True)
    im = Image.open(ruta).convert("RGB")
    grande = im.copy(); grande.thumbnail((1200, 1200), Image.LANCZOS)
    grande.save(os.path.join(DEST, prod, base + ".webp"), "WEBP", quality=82, method=6)
    chica = im.copy(); chica.thumbnail((520, 700), Image.LANCZOS)
    chica.save(os.path.join(DEST, prod, base + "-sm.webp"), "WEBP", quality=80, method=6)

# logos (con transparencia)
os.makedirs(os.path.join(DEST, "logos"), exist_ok=True)
for ruta in glob.glob(os.path.join(ORIG, "logos", "logo-*.png")):
    base = os.path.splitext(os.path.basename(ruta))[0]
    im = Image.open(ruta).convert("RGBA"); im.thumbnail((640, 640), Image.LANCZOS)
    im.save(os.path.join(DEST, "logos", base + ".webp"), "WEBP", quality=90, method=6)

# favicon / íconos
ico = Image.open(os.path.join(ORIG, "logos", "icono-favicon.png")).convert("RGBA")
for t in (32, 180, 192):
    ico.resize((t, t), Image.LANCZOS).save(os.path.join(DEST, f"favicon-{t}.png"), optimize=True)
print("listo")
