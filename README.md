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

## Imagen del héroe (inicio)
Sube la foto como `fotos-pagina-harmon/hero/hero-entrega.jpg` (vertical, proporción 4:5 ideal). El sitio la detecta solo y muestra el héroe en dos columnas. Mientras el archivo no exista, el texto del héroe va centrado. Para optimizarla a WebP corre `python3 herramientas/optimizar_imagenes.py`.
