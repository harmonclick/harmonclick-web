"""Crea data/colonias/NN.json (C.P. -> colonias) a partir del archivo oficial de SEPOMEX (gratis).

Hay un archivo por los 2 primeros dígitos del C.P. (data/colonias/44.json, data/colonias/01.json...).
Así el sitio descarga solo el archivo de la zona que escribió la persona, no todo México.

Descarga primero el archivo de códigos postales de Correos de México (CPdescarga.txt) desde su
página de datos abiertos y guárdalo en tu computadora. Después corre:

    python3 herramientas/generar_colonias.py ruta/al/CPdescarga.txt

Si el archivo no existe para un C.P., la colonia se escribe a mano.
"""
import csv, collections, glob, json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if len(sys.argv) != 2:
    sys.exit(__doc__)

colonias = collections.defaultdict(set)
with open(sys.argv[1], encoding="latin-1", newline="") as f:
    lineas = f.read().splitlines()

# El encabezado trae los nombres de columna; las filas de datos van debajo, separadas por "|"
inicio = next((i for i, l in enumerate(lineas) if "d_codigo" in l and "d_asenta" in l), None)
if inicio is None:
    sys.exit("No encontré el encabezado (d_codigo|d_asenta). ¿Es el archivo CPdescarga.txt de SEPOMEX?")

for fila in csv.DictReader(lineas[inicio:], delimiter="|"):
    cp = (fila.get("d_codigo") or "").strip().zfill(5)
    asenta = (fila.get("d_asenta") or "").strip()
    if len(cp) == 5 and cp.isdigit() and asenta:
        colonias[cp].add(asenta)

# Un archivo por prefijo de 2 dígitos. Antes se borran los anteriores para no dejar archivos viejos.
carpeta = os.path.join(RAIZ, "data", "colonias")
os.makedirs(carpeta, exist_ok=True)
for viejo in glob.glob(os.path.join(carpeta, "*.json")):
    os.remove(viejo)

por_prefijo = collections.defaultdict(dict)
for cp, nombres in sorted(colonias.items()):
    por_prefijo[cp[:2]][cp] = sorted(nombres)

for prefijo, mapa in sorted(por_prefijo.items()):
    with open(os.path.join(carpeta, prefijo + ".json"), "w", encoding="utf-8") as f:
        json.dump(mapa, f, ensure_ascii=False, separators=(",", ":"))

total = sum(len(v) for v in colonias.values())
print(len(colonias), "C.P.", total, "colonias en", len(por_prefijo), "archivos ->", os.path.relpath(carpeta, RAIZ) + "/NN.json")
