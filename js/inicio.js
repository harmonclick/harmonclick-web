/* Página de inicio */
(function () {
  "use strict";
  HC.listo.then((datos) => {
    const prods = datos.productos;

    // Botones generales de WhatsApp
    HC.$$("[data-wa-general]").forEach((a) => (a.href = HC.waUrl(datos, "¡Hola! Quiero información sobre sus productos.")));

    // Video del héroe: autoplay en silencio y en bucle; un clic lo pausa o lo reanuda.
    const video = HC.$("#video-heroe"), vbtn = HC.$("#video-btn");
    if (video && vbtn) {
      let pausadoPorUsuario = false;
      const reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const estado = (pausado) => {
        vbtn.dataset.pausado = String(pausado);
        vbtn.setAttribute("aria-label", pausado ? "Reproducir video" : "Pausar video");
      };
      const reproducir = () => {
        const r = video.play();
        if (r && r.catch) r.catch(() => estado(true));   // si el navegador bloquea el autoplay, muestra el botón de play
      };
      // Pantallas chicas: versión ligera de 720 px (la del HTML). Pantallas grandes: versión completa (WebM primero, luego MP4).
      const ahorro = navigator.connection && navigator.connection.saveData;
      if (window.matchMedia("(min-width: 900px)").matches && !ahorro) {
        video.innerHTML = '<source src="fotos-pagina-harmon/hero/intro-portada.webm" type="video/webm"><source src="fotos-pagina-harmon/hero/intro-portada.mp4" type="video/mp4">';
        video.load();
      }
      video.muted = true;
      video.addEventListener("play", () => estado(false));
      video.addEventListener("pause", () => estado(true));
      vbtn.addEventListener("click", () => {
        if (video.paused) { pausadoPorUsuario = false; reproducir(); }
        else { pausadoPorUsuario = true; video.pause(); }
      });
      if (reducido) { video.pause(); estado(true); }       // quien prefiere menos movimiento lo inicia a mano
      else {
        reproducir();
        // Ahorra batería: se pausa fuera de pantalla y vuelve solo (salvo que lo hayas pausado tú)
        if ("IntersectionObserver" in window) {
          new IntersectionObserver((es) => es.forEach((e) => {
            if (e.isIntersecting) { if (!pausadoPorUsuario && video.paused) reproducir(); }
            else if (!video.paused) video.pause();
          }), { threshold: 0.25 }).observe(vbtn);
        }
      }
    }

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
