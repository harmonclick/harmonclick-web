"""Actualiza la versión (?v=AAAAMMDD) de los archivos CSS, JS y de datos en todo el sitio.
Así, cada vez que publicas un cambio, los visitantes descargan los archivos nuevos y no los viejos guardados en su navegador.

Uso:   python3 herramientas/actualizar_version.py            (usa la fecha de hoy; si ya estaba puesta, le agrega una letra: 20261013 -> 20261013b -> 20261013c)
       python3 herramientas/actualizar_version.py 20261231   (usa la versión que indiques)
Córrelo cada vez que cambies css/, js/ o data/ y antes de hacer commit.
"""
import datetime, glob, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMATO = r"\d{8}[a-z]?"


def version_actual():
    with open(os.path.join(RAIZ, "js", "app.js"), encoding="utf-8") as f:
        m = re.search(r'const VERSION = "(' + FORMATO + r')";', f.read())
    return m.group(1) if m else ""


if len(sys.argv) > 1:
    version = sys.argv[1]
else:
    hoy = datetime.date.today().strftime("%Y%m%d")
    actual = version_actual()
    if actual.startswith(hoy):  # ya se publicó una versión hoy: sube la letra para que los navegadores descarguen lo nuevo
        sufijo = actual[8:]
        version = hoy + ("b" if not sufijo else chr(ord(sufijo) + 1))
    else:
        version = hoy
if not re.fullmatch(FORMATO, version):
    sys.exit("La versión debe ser la fecha con 8 dígitos y, si quieres, una letra, por ejemplo 20261231 o 20261231b")

PATRON_ARCHIVOS = re.compile(r'((?:src|href)="(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=\w+)?"')
PATRON_DATOS = re.compile(r'(href="data/products\.json)(?:\?v=\w+)?"')
PATRON_CONST = re.compile(r'(const VERSION = ")\d{8}[a-z]?(";)')

cambiados = []
destinos = glob.glob(os.path.join(RAIZ, "*.html")) + [os.path.join(RAIZ, "js", "app.js"), os.path.join(RAIZ, "herramientas", "generar_paginas_producto.py")]
for ruta in destinos:
    with open(ruta, encoding="utf-8") as f:
        original = f.read()
    t = PATRON_ARCHIVOS.sub(lambda m: f'{m.group(1)}?v={version}"', original)
    t = PATRON_DATOS.sub(lambda m: f'{m.group(1)}?v={version}"', t)
    t = PATRON_CONST.sub(lambda m: f'{m.group(1)}{version}{m.group(2)}', t)
    if t != original:
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(t)
        cambiados.append(os.path.relpath(ruta, RAIZ))
print(f"Versión {version}: {len(cambiados)} archivos actualizados")
for c in cambiados:
    print("  ", c)
