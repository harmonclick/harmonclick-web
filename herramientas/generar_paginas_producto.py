"""Genera shilajit.html, uro.html, ashwagandha.html y nad.html a partir de data/products.json.
Solo hace falta correrlo si cambias el nombre, la descripción corta (metaDescripcion) o la foto principal de un producto.
Los PRECIOS no requieren correrlo: se leen directo de products.json.
Uso:  python3 herramientas/generar_paginas_producto.py
"""
import json, os, html
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.load(open(os.path.join(RAIZ, "data", "products.json"), encoding="utf-8"))
dom = datos["sitio"]["dominio"]
PLANTILLA = """<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{nombre} | Harmon &amp; Click</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{dom}/{pagina}">
  <meta name="theme-color" content="#007a55">
  <link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="img/favicon-192.png">
  <link rel="apple-touch-icon" href="img/favicon-180.png">
  <meta property="og:type" content="product">
  <meta property="og:locale" content="es_MX">
  <meta property="og:site_name" content="Harmon &amp; Click">
  <meta property="og:title" content="{nombre} | Harmon &amp; Click">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{dom}/{pagina}">
  <meta property="og:image" content="{dom}/img/og/og-{id}.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{nombre}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&amp;family=Plus+Jakarta+Sans:wght@400..600&amp;display=swap">
  <link rel="stylesheet" href="css/estilos.css">
  <link rel="preload" href="data/products.json" as="fetch" crossorigin>
</head>
<body data-pagina="producto" data-producto="{id}">
  <a class="saltar" href="#contenido">Saltar al contenido</a>
  <div data-cabecera></div>
  <main id="contenido">
    <div id="producto-raiz">
      <div class="contenedor" style="padding-block:3rem">
        <div class="esqueleto" style="height:60vh"></div>
        <noscript><p>Para ver este producto necesitas activar JavaScript. También puedes pedirlo por WhatsApp: <a href="https://wa.me/523353310072">+52 33 5331 0072</a>.</p></noscript>
      </div>
    </div>
  </main>
  <div data-pie></div>
  <script src="js/app.js" defer></script>
  <script src="js/producto.js" defer></script>
</body>
</html>
"""
for p in datos["productos"]:
    out = PLANTILLA.format(nombre=html.escape(p["nombre"]), desc=html.escape(p["metaDescripcion"]), dom=dom, pagina=p["pagina"], id=p["id"])
    open(os.path.join(RAIZ, p["pagina"]), "w", encoding="utf-8").write(out)
    print("generada", p["pagina"])
