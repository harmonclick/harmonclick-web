# Harmon & Click — tienda en línea

Sitio estático (HTML + CSS + JavaScript), sin servidor y sin costo, publicado con GitHub Pages en **harmonclick.com**.

## Cómo cambiar un precio
Abre `data/products.json`, busca el producto y cambia solo el número de `"precio"`. Guarda (commit) y en 1 o 2 minutos el sitio se actualiza. El "ahorras", el precio por frasco y el total del carrito se calculan solos.

## Estructura
- `index.html`, `shilajit.html`, `uro.html`, `ashwagandha.html`, `nad.html`, `carrito.html`, `aviso-de-privacidad.html`
- `data/products.json` — precios y textos de productos · `data/cobertura.json` — códigos postales con contra entrega
- `css/estilos.css` — sistema de diseño · `js/` — lógica del sitio
- `img/` — fotos optimizadas (WebP) · `fotos-pagina-harmon/` — fotos originales (no se tocan)
- `herramientas/` — scripts para regenerar imágenes, cobertura y páginas de producto (opcionales)

## Video del héroe (inicio)
El video vertical (9:16) vive en `fotos-pagina-harmon/hero/intro-portada.mp4` y su imagen de portada en `img/hero/intro-portada-poster.webp`. Para cambiarlo, sube un video con ese mismo nombre (MP4 H.264, vertical, sin audio de preferencia y lo más ligero posible).
