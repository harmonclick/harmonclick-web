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

## Videos del inicio
Están en `fotos-pagina-harmon/videos/` (`uro` y `shilajit`, en `.mp4` y `.webm`) y sus portadas en `img/videos/`. Solo se descargan cuando la persona toca play. Los videos originales (pesados) no se guardan en el repositorio. Para cambiar uno, comprímelo (ffmpeg, 720 px de ancho, `-crf 28`) y reemplaza ambos formatos con el mismo nombre.

## Versión de los archivos (caché del navegador)
Los archivos CSS, JS y de datos se cargan con una versión (`?v=AAAAMMDD`) para que los visitantes siempre reciban lo último. **Cada vez que cambies algo en `css/`, `js/` o `data/`**, corre antes de hacer commit:

    python3 herramientas/actualizar_version.py

(usa la fecha de hoy; si ya la habías usado, le agrega una letra, como `20261013b`, para que los navegadores descarguen lo nuevo; también acepta una versión, por ejemplo `... 20261231`). Actualiza todas las páginas y `js/app.js` de una sola vez.

