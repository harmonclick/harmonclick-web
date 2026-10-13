/* Página de inicio */
(function () {
  "use strict";
  HC.listo.then((datos) => {
    const prods = datos.productos;

    // Botones generales de WhatsApp
    HC.$$("[data-wa-general]").forEach((a) => (a.href = HC.waUrl(datos, "¡Hola! Quiero información sobre sus productos.")));

    // Imagen del héroe: prueba la versión optimizada y, si no existe, el original.
    // Si ninguna existe, la columna derecha queda oculta y el texto se centra.
    const heroe = HC.$("#heroe"), fig = HC.$("#heroe-imagen");
    const rutas = ["img/hero/hero-entrega.webp", "fotos-pagina-harmon/hero/hero-entrega.jpg"];
    const probar = (i) => {
      if (i >= rutas.length) return;
      const im = new Image();
      im.onload = () => {
        im.alt = "Recibe tu pedido de Harmon & Click en la puerta de tu casa";
        im.decoding = "async"; im.width = 960; im.height = 1200;
        fig.appendChild(im);
        heroe.classList.add("heroe--con-imagen");
      };
      im.onerror = () => probar(i + 1);
      im.src = rutas[i];
    };
    probar(0);

    // Tarjetas de producto
    HC.$("#rejilla").innerHTML = prods.map((p) => {
      const u = p.precios.uno;
      return `<a class="tarjeta revelar" href="${p.pagina}">
        ${HC.fotoTarjeta(p, 0)}
        <div class="tarjeta__cuerpo">
          <span class="tarjeta__tipo">${p.categoria}</span>
          <h3>${p.nombre}</h3>
          <p class="tarjeta__beneficio">${p.beneficioCorto}</p>
          <div class="tarjeta__precio"><span class="tarjeta__desde">Desde</span><span class="precio">${HC.fmt(u.precio)}</span>${u.antes ? `<span class="precio-antes"><span class="solo-lectores">Antes </span>${HC.fmt(u.antes)}</span>` : ""}</div>
          <span class="btn btn--secundario btn--bloque">Ver producto</span>
        </div></a>`;
    }).join("");
    HC.revelar(HC.$("#rejilla"));

    // Revisor de código postal
    HC.montarChecker(HC.$("#revisor"), { irAProductos: true });

    // Preguntas frecuentes
    HC.montarAcordeon(HC.$("#acordeon"), datos.faq);

    // Testimonios (solo si los activas en products.json)
    const s = datos.sitio;
    if (s.mostrarTestimonios && s.testimonios.length) {
      HC.$("#testimonios-lista").innerHTML = s.testimonios.map((t) => `<figure class="testimonio revelar" style="margin:0"><blockquote></blockquote><cite></cite></figure>`).join("");
      HC.$$("#testimonios-lista .testimonio").forEach((f, i) => {
        HC.$("blockquote", f).textContent = "“" + s.testimonios[i].texto + "”";
        HC.$("cite", f).textContent = s.testimonios[i].nombre;
      });
      HC.$("#testimonios").hidden = false;
      HC.revelar();
    }
    HC.pintarIconos();
  });
})();
