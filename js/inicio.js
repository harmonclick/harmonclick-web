/* Página de inicio */
(function () {
  "use strict";
  HC.listo.then((datos) => {
    const prods = datos.productos;

    // Botones generales de WhatsApp
    HC.$$("[data-wa-general]").forEach((a) => (a.href = HC.waUrl(datos, "¡Hola! Quiero información sobre sus productos.")));

    // Collage del héroe (foto 1 de cada producto)
    HC.$("#collage").innerHTML = prods.map((p) =>
      `<a href="${p.pagina}" aria-label="Ver ${p.nombre}">${HC.foto(p, 0, { eager: true, sizes: "(min-width:900px) 150px, 44vw" })}</a>`).join("");

    // Tarjetas de producto
    HC.$("#rejilla").innerHTML = prods.map((p) => {
      const u = p.precios.uno;
      return `<a class="tarjeta revelar" href="${p.pagina}">
        ${HC.foto(p, 0)}
        <div class="tarjeta__cuerpo">
          <span class="tarjeta__tipo">${p.categoria}</span>
          <h3>${p.nombre}</h3>
          <p class="tarjeta__beneficio">${p.beneficioCorto}</p>
          <div class="tarjeta__precio"><span class="tarjeta__desde">Desde</span><span class="precio">${HC.fmt(u.precio)}</span>${u.antes ? `<span class="precio-antes"><span class="solo-lectores">Antes </span>${HC.fmt(u.antes)}</span>` : ""}</div>
          <span class="btn btn--secundario btn--sm btn--bloque">Ver producto</span>
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
