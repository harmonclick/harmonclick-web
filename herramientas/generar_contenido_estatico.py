"""Escribe en el HTML los productos del inicio y las preguntas frecuentes, a partir de data/products.json.
Así Google ve nombres, descripciones, precios y preguntas directamente en el HTML (el JavaScript solo los mejora).
También crea los datos estructurados (JSON-LD) FAQPage de preguntas-frecuentes.html.

Uso:  python3 herramientas/generar_contenido_estatico.py
(herramientas/actualizar_version.py ya lo corre solo; sirve si cambias precios, textos o preguntas en products.json)
"""
import html, json, os, re, urllib.parse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(RAIZ, "data", "products.json"), encoding="utf-8") as f:
    datos = json.load(f)

def txt(s): return html.escape(s, quote=False)
def attr(s): return html.escape(s, quote=True)
def peso(n): return "$" + f"{int(round(n)):,}"

def tarjeta(p):
    f = p["fotos"][0]
    u = p["precios"]["uno"]
    antes = f'<span class="precio-antes"><span class="solo-lectores">Antes </span>{peso(u["antes"])}</span>' if u.get("antes") else ""
    return f'''<a class="tarjeta revelar" href="{p["pagina"]}">
        <div class="tarjeta__img"><img src="{f["src"]}-sm.webp" srcset="{f["src"]}-sm.webp 520w, {f["src"]}.webp 1200w" sizes="(min-width:1000px) 280px, 46vw" alt="{attr(f["alt"])}" loading="lazy" decoding="async" width="520" height="650"></div>
        <div class="tarjeta__cuerpo">
          <span class="tarjeta__tipo">{txt(p["categoria"])}</span>
          <h3>{txt(p["nombre"])}</h3>
          <p class="tarjeta__beneficio">{txt(p["beneficioCorto"])}</p>
          <div class="tarjeta__precio"><span class="tarjeta__desde">Desde</span><span class="precio">{peso(u["precio"])}</span>{antes}</div>
          <span class="btn btn--secundario btn--bloque">Ver producto</span>
        </div></a>'''

MAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>'

def respuesta_faq(it):
    r = txt(it["r"])
    frase = it.get("enlaceWhatsApp")  # frase de la respuesta que lleva el enlace general de WhatsApp (el mismo de los botones)
    if frase:
        s = datos["sitio"]
        url = f'https://wa.me/{s["whatsapp"]}?text=' + urllib.parse.quote(s["mensajeWhatsApp"], safe="!")
        r = r.replace(txt(frase), f'<a href="{url}" target="_blank" rel="noopener">{txt(frase)}</a>', 1)
    return r

def fila_faq(it, i):
    return f'''
      <div class="acordeon__item">
        <h3 style="margin:0;font-size:inherit"><button class="acordeon__boton" type="button" aria-expanded="false" aria-controls="faq-p{i}" id="faq-b{i}">{txt(it["p"])}{MAS}</button></h3>
        <div class="acordeon__panel" id="faq-p{i}" role="region" aria-labelledby="faq-b{i}"><div><p>{respuesta_faq(it)}</p></div></div>
      </div>'''

def faq_html(items):
    mitad = -(-len(items) // 2)
    col1 = "".join(fila_faq(it, i) for i, it in enumerate(items[:mitad]))
    col2 = "".join(fila_faq(it, i + mitad) for i, it in enumerate(items[mitad:]))
    return f'<div class="acordeon__col">{col1}</div>\n      <div class="acordeon__col">{col2}</div>'

def faq_ld(items):
    ld = {"@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": [{"@type": "Question", "name": it["p"], "acceptedAnswer": {"@type": "Answer", "text": it["r"]}} for it in items]}
    return '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>"

def reemplazar(ruta, marca, contenido):
    with open(os.path.join(RAIZ, ruta), encoding="utf-8") as f:
        t = f.read()
    patron = re.compile(r"(<!-- INICIO:%s -->)(.*?)(<!-- FIN:%s -->)" % (marca, marca), re.S)
    if not patron.search(t):
        raise SystemExit(f"No encontré las marcas INICIO:{marca} / FIN:{marca} en {ruta}")
    nuevo = patron.sub(lambda m: m.group(1) + "\n" + contenido + "\n" + m.group(3), t)
    if nuevo != t:
        with open(os.path.join(RAIZ, ruta), "w", encoding="utf-8") as f:
            f.write(nuevo)
        return True
    return False

cambios = [
    reemplazar("index.html", "PRODUCTOS", "\n".join(tarjeta(p) for p in datos["productos"])),
    reemplazar("preguntas-frecuentes.html", "FAQ", "      " + faq_html(datos["faq"])),
    reemplazar("preguntas-frecuentes.html", "FAQ-LD", "  " + faq_ld(datos["faq"])),
]
print("Contenido estático:", "actualizado" if any(cambios) else "sin cambios")
