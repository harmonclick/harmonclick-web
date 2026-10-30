"""Genera shilajit.html, uro.html, ashwagandha.html y nad.html a partir de data/products.json.
Solo hace falta correrlo si cambias el nombre, la descripción corta (metaDescripcion), las fotos o los precios de un producto:
el bloque Product JSON-LD de cada página se escribe aquí a partir de esos datos.
Uso:  python3 herramientas/generar_paginas_producto.py
"""
import json, os, html
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datos = json.load(open(os.path.join(RAIZ, "data", "products.json"), encoding="utf-8"))
dom = datos["sitio"]["dominio"]
# Paquetes que la página muestra como tarjetas (cuatroMas no es tarjeta: es texto o se pide por WhatsApp)
PAQUETES = ("uno", "duo", "trio")

def product_ld(p):
    url = f"{dom}/{p['pagina']}"
    precios = [p["precios"][c]["precio"] for c in PAQUETES if c in p["precios"]]
    if len(precios) == 1:
        oferta = {"@type": "Offer", "price": str(precios[0])}
    else:
        oferta = {"@type": "AggregateOffer", "lowPrice": str(min(precios)), "highPrice": str(max(precios)), "offerCount": len(precios)}
    oferta.update({
        "priceCurrency": "MXN", "availability": "https://schema.org/InStock", "url": url,
        "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {"@type": "MonetaryAmount", "value": 0, "currency": "MXN"},
            "shippingDestination": {"@type": "DefinedRegion", "addressCountry": "MX"},
            "deliveryTime": {
                "@type": "ShippingDeliveryTime",
                "handlingTime": {"@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY"},
                "transitTime": {"@type": "QuantitativeValue", "minValue": 3, "maxValue": 7, "unitCode": "DAY"},
                "businessDays": {"@type": "OpeningHoursSpecification", "dayOfWeek": ["https://schema.org/Monday", "https://schema.org/Tuesday", "https://schema.org/Wednesday", "https://schema.org/Thursday", "https://schema.org/Friday"]}
            }
        },
        "hasMerchantReturnPolicy": {"@type": "MerchantReturnPolicy", "applicableCountry": "MX", "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted"}
    })
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p["nombre"], "description": p["metaDescripcion"],
          "image": [f"{dom}/{f['src']}.webp" for f in p["fotos"]], "brand": {"@type": "Brand", "name": "Harmon & Click"},
          "sku": p["sku"], "url": url, "offers": oferta}
    return json.dumps(ld, ensure_ascii=False, indent=2)

PLANTILLA = """<!doctype html>
<html lang="es-MX">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MTRG7J935J"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-MTRG7J935J');
  </script>
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '2111767482741613');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=2111767482741613&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
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
  <link rel="stylesheet" href="css/estilos.css?v=20261030c">
  <link rel="preload" href="data/products.json?v=20261030c" as="fetch" crossorigin>
  <script type="application/ld+json">{ld}</script>
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
  <script src="js/app.js?v=20261030c" defer></script>
  <script src="js/producto.js?v=20261030c" defer></script>
</body>
</html>
"""
for p in datos["productos"]:
    out = PLANTILLA.format(nombre=html.escape(p["nombre"]), desc=html.escape(p["metaDescripcion"]), dom=dom, pagina=p["pagina"], id=p["id"], ld=product_ld(p))
    open(os.path.join(RAIZ, p["pagina"]), "w", encoding="utf-8").write(out)
    print("generada", p["pagina"])
