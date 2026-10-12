"""Crea las imágenes de vista previa (1200x630) para WhatsApp/Facebook en img/og/.
Uso:  python3 herramientas/generar_og.py     (requiere: pip install pillow)
"""
import json, os
from PIL import Image, ImageFilter
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(RAIZ, "img", "og"), exist_ok=True)
datos = json.load(open(os.path.join(RAIZ, "data", "products.json"), encoding="utf-8"))
def abrir(r): return Image.open(os.path.join(RAIZ, r)).convert("RGBA")
W, H = 1200, 630

def contener(im, w, h):
    im = im.copy(); im.thumbnail((w, h), Image.LANCZOS); return im

for p in datos["productos"]:
    foto = abrir(p["fotos"][0]["src"] + ".webp").convert("RGB")
    fondo = foto.copy(); fondo = fondo.resize((W, int(W * foto.height / foto.width)), Image.LANCZOS)
    fondo = fondo.crop((0, (fondo.height - H) // 2, W, (fondo.height - H) // 2 + H)).filter(ImageFilter.GaussianBlur(28))
    lienzo = fondo.convert("RGBA")
    f = contener(foto, W, H - 0)
    lienzo.paste(f, ((W - f.width) // 2, (H - f.height) // 2))
    lienzo.convert("RGB").save(os.path.join(RAIZ, "img", "og", f"og-{p['id']}.jpg"), quality=85, optimize=True)

lienzo = Image.new("RGB", (W, H), (19, 28, 25)).convert("RGBA")
logo = contener(abrir("img/logos/logo-con-lema-fondo-oscuro.webp"), 460, 330)
lienzo.paste(logo, (90, (H - logo.height) // 2), logo)
x0, y0, cw, ch, gap = 640, 14, 220, 293, 16
for i, p in enumerate(datos["productos"]):
    t = abrir(p["fotos"][0]["src"] + ".webp").convert("RGB")
    t.thumbnail((cw * 2, ch * 2)); marco = Image.new("RGB", (cw, ch), (30, 40, 36))
    t = contener(t, cw, ch); marco.paste(t, ((cw - t.width) // 2, (ch - t.height) // 2))
    lienzo.paste(marco, (x0 + (i % 2) * (cw + gap), y0 + (i // 2) * (ch + gap)))
lienzo.convert("RGB").save(os.path.join(RAIZ, "img", "og", "og-inicio.jpg"), quality=85, optimize=True)
print("listo")
