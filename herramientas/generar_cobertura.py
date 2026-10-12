"""Convierte cobertura_contra_entrega.csv en data/cobertura.json (compacto).
- Normaliza los C.P. a 5 dígitos (rellena con ceros a la izquierda).
- NO guarda nombres de paqueterías.
Uso:  python3 herramientas/generar_cobertura.py
"""
import csv, json, os, collections
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN = {"de", "del", "la", "las", "los", "el", "y", "e"}

def bonito(t):
    pal = t.strip().lower().split()
    return " ".join(p if (i and p in MIN) else p[:1].upper() + p[1:] for i, p in enumerate(pal))

grupos = collections.defaultdict(set)
vistos = set()
with open(os.path.join(RAIZ, "cobertura_contra_entrega.csv"), encoding="utf-8-sig", newline="") as f:
    for fila in csv.DictReader(f):
        cp = fila["cp"].strip().zfill(5)
        if not cp.isdigit() or len(cp) != 5 or cp in vistos:
            continue
        vistos.add(cp)
        grupos[(bonito(fila["estado"]), bonito(fila["municipio"]))].add(int(cp))

estados = sorted({e for e, _ in grupos})
filas = []
for (e, m), cps in sorted(grupos.items()):
    cps = sorted(cps); rangos = []; ini = prev = cps[0]
    for c in cps[1:]:
        if c == prev + 1: prev = c; continue
        rangos += [ini, prev - ini + 1]; ini = prev = c
    rangos += [ini, prev - ini + 1]
    filas.append([estados.index(e), m, rangos])
out = os.path.join(RAIZ, "data", "cobertura.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump({"estados": estados, "grupos": filas}, f, ensure_ascii=False, separators=(",", ":"))
print(len(vistos), "C.P.", os.path.getsize(out) // 1024, "KB")
