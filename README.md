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
Vive en `fotos-pagina-harmon/hero/` en cuatro versiones: `intro-portada.mp4` (original), `intro-portada.webm` (VP9, pantallas grandes) y `intro-portada-720.webm` / `intro-portada-720.mp4` (720 px, ligeras, para celular). La imagen de portada es `img/hero/intro-portada-poster.webp`. Si cambias el video, genera las 3 versiones restantes con ffmpeg (WebM primero, MP4 de respaldo), por ejemplo:

    ffmpeg -i intro-portada.mp4 -vf scale=720:1280 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart intro-portada-720.mp4
    ffmpeg -i intro-portada.mp4 -vf scale=720:1280 -an -c:v libvpx-vp9 -b:v 0 -crf 36 intro-portada-720.webm
    ffmpeg -i intro-portada.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 37 intro-portada.webm
