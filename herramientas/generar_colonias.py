"""Crea data/colonias.json (C.P. -> colonias) a partir del archivo oficial de SEPOMEX (gratis).

Descarga primero el archivo de códigos postales de Correos de México (CPdescarga.txt) desde su
página de datos abiertos y guárdalo en tu computadora. Después corre:

    python3 herramientas/generar_colonias.py ruta/al/CPdescarga.txt

El resultado pesa unos cuantos cientos de KB comprimido. El sitio lo descarga solo cuando la persona
escribe su C.P.; si el archivo no existe, la colonia se escribe a mano.
"""
import csv, collections, json, os, sys

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

salida = {cp: sorted(nombres) for cp, nombres in sorted(colonias.items())}
ruta = os.path.join(RAIZ, "data", "colonias.json")
with open(ruta, "w", encoding="utf-8") as f:
    json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))
print(len(salida), "C.P.", sum(len(v) for v in salida.values()), "colonias ->", os.path.relpath(ruta, RAIZ), os.path.getsize(ruta) // 1024, "KB")
