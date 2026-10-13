/* Página de producto: galería, selector de paquetes, compra y contenido. Todo sale de data/products.json */
(function () {
  "use strict";
  const idProducto = document.body.dataset.producto;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  HC.listo.then((datos) => {
    const p = HC.producto(datos, idProducto);
    const raiz = HC.$("#producto-raiz");
    if (!p) { raiz.innerHTML = '<div class="contenedor vacio"><h1>No encontramos este producto</h1><a class="btn" href="index.html#productos">Ver productos</a></div>'; return; }

    const t = p.tema;
    let clave = "trio"; // el Trío viene preseleccionado (es el favorito)

    /* ---------- Plantilla ---------- */
    const slides = p.fotos.map((f, i) => `
      <div class="galeria__slide" role="group" aria-roledescription="diapositiva" aria-label="Foto ${i + 1} de ${p.fotos.length}" data-i="${i}">
        <img src="${f.src}.webp" srcset="${f.src}-sm.webp 520w, ${f.src}.webp 1200w" sizes="(min-width:900px) 600px, 100vw" alt="${esc(f.alt)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="1200" height="1200">
      </div>`).join("");
    const minis = p.fotos.map((f, i) => `
      <button class="miniatura" type="button" data-i="${i}" aria-label="Ver foto ${i + 1} de ${p.fotos.length}" ${i === 0 ? 'aria-current="true"' : ""}>
        <img src="${f.src}-sm.webp" alt="" loading="lazy" decoding="async" width="84" height="105">
      </button>`).join("");

    const tarjetaPaquete = (c) => {
      const q = HC.paquete(p, c);
      const detalle = q.n === 1 ? "" : `${q.n} frascos · ${HC.fmt(q.cadaUno)} c/u`;
      return `
      <button class="paquete" type="button" role="radio" aria-checked="false" tabindex="-1" data-clave="${c}">
        ${c === "trio" ? '<span class="etiqueta-favorito">Favorito</span>' : ""}
        <span class="paquete__radio" aria-hidden="true">${HC.icono.checkFino}</span>
        <span>
          <span class="paquete__nombre">${q.nombre}</span>
          ${detalle ? `<span class="paquete__detalle">${detalle}</span>` : ""}
          ${q.ahorro > 0 ? `<span class="paquete__ahorro">Ahorras ${HC.fmt(q.ahorro)}</span>` : ""}
        </span>
        <span class="paquete__precio">
          ${q.antes ? `<span class="precio-antes"><span class="solo-lectores">Antes </span>${HC.fmt(q.antes)}</span>` : ""}
          <span class="precio">${HC.fmt(q.precio)}</span>
        </span>
        ${q.frase ? `<p class="paquete__frase">${esc(q.frase)}</p>` : ""}
      </button>`;
    };

    const c4 = p.precios.cuatroMas;
    const textoCuatro = c4.mostrarTexto
      ? `<p class="pp-cuatro">¿Quieres 4 o más? <a href="#" data-wa-cuatro>Escríbenos</a> y te los dejamos a ${HC.fmt(c4.precio)} c/u.</p>` : "";

    const beneficios = p.beneficios.map((b) => `
      <li class="beneficio">${HC.icono.checkFino}<div><strong>${esc(b.t)}</strong><span>${esc(b.d)}</span></div></li>`).join("");
    const pasos = p.uso.pasos.map((x) => `<li>${esc(x)}</li>`).join("");
    const notas = p.uso.notas.length ? `<ul class="lista-notas">${p.uso.notas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const filas = p.composicion.filas.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join("");
    const sellos = p.composicion.sellos.map((x) => `<li>${HC.icono.check}${esc(x)}</li>`).join("");
    const noRec = p.noRecomendado ? `
      <div class="alerta-caja" role="note"><h3>${esc(p.noRecomendado.titulo)}</h3><ul>${p.noRecomendado.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
    const otros = datos.productos.filter((x) => x.id !== p.id).map((x) => `
      <a class="tarjeta revelar" href="${x.pagina}">${HC.fotoTarjeta(x, 0)}
        <div class="tarjeta__cuerpo"><h3>${x.nombre}</h3>
          <div class="tarjeta__precio"><span class="tarjeta__desde">Desde</span><span class="precio">${HC.fmt(x.precios.uno.precio)}</span></div>
          <span class="btn btn--secundario btn--bloque">Ver producto</span></div></a>`).join("");

    raiz.innerHTML = `
    <div class="pp-cab">
      <div class="contenedor">
        <nav class="migas" aria-label="Ruta de navegación">
          <a href="index.html#productos">${HC.icono.izq}Todos los productos</a>
        </nav>
        <div class="pp-grid">
          <div class="pp-titulo">
            <span class="tipo" data-c="verde">${esc(p.categoria)}</span>
            <h1>${esc(p.nombre)}</h1>
            <p>${esc(p.lema)}</p>
          </div>
          <div class="galeria" role="region" aria-roledescription="carrusel" aria-label="Fotos de ${esc(p.nombre)}" style="--tema-fondo:${t.fondo}">
            <div class="galeria__visor">
              <div class="galeria__pista" tabindex="0" aria-label="Galería de fotos. Desliza o usa las flechas del teclado.">${slides}</div>
              <button class="galeria__flecha galeria__flecha--ant" type="button" aria-label="Foto anterior">${HC.icono.izq}</button>
              <button class="galeria__flecha galeria__flecha--sig" type="button" aria-label="Foto siguiente">${HC.icono.der}</button>
              <span class="galeria__contador" aria-live="polite">1 / ${p.fotos.length}</span>
            </div>
            <div class="galeria__miniaturas">${minis}</div>
          </div>

          <div class="pp-panel">
            <h2 id="titulo-paquete">Elige tu paquete</h2>
            <div class="paquetes" role="radiogroup" aria-labelledby="titulo-paquete">
              ${["uno", "duo", "trio"].map(tarjetaPaquete).join("")}
            </div>
            ${textoCuatro}
            <div class="pp-botones">
              <button class="btn btn--compra btn--bloque" type="button" id="btn-agregar">Agregar al carrito</button>
              <a class="btn btn--secundario btn--bloque" id="btn-wa" href="#" target="_blank" rel="noopener">${HC.icono.wa}Pedir por WhatsApp</a>
            </div>
            <ul class="pp-envio">
              <li>${HC.icono.camion}Envío gratis en todos tus pedidos</li>
              <li>${HC.icono.efectivo}Pagas en efectivo al recibir</li>
              <li>${HC.icono.escudo}Producto 100% original y sellado</li>
            </ul>
            <div class="zona--compacta" id="revisor"></div>
          </div>
        </div>
      </div>
    </div>

    <section class="pp-seccion">
      <div class="contenedor">
        <div class="pp-seccion__cab"><h2>Sobre ${esc(p.nombreCorto)}</h2></div>
        <p class="pp-intro">${esc(p.intro)}</p>
        <ul class="beneficios revelar">${beneficios}</ul>
        ${p.notaBeneficios ? `<p class="nota" style="margin-top:var(--s5)">${esc(p.notaBeneficios)}</p>` : ""}
      </div>
    </section>

    <section class="pp-seccion pp-seccion--bg">
      <div class="contenedor dos-col">
        <div class="revelar">
          <div class="pp-seccion__cab"><h2>${esc(p.uso.titulo)}</h2></div>
          <ol class="lista-pasos">${pasos}</ol>
          ${notas}
        </div>
        <div class="revelar">
          <div class="pp-seccion__cab"><h2>¿Para quién es?</h2></div>
          <p>${esc(p.paraQuien.texto)}</p>
          ${p.paraQuien.extra ? `<p class="extra-pareja">${esc(p.paraQuien.extra)}</p>` : ""}
          <h3 style="font-family:var(--f-cuerpo);font-size:var(--t-base);font-weight:600;letter-spacing:0;margin-top:var(--s6)">Qué esperar</h3>
          <p>${esc(p.resultados)}</p>
          ${noRec}
        </div>
      </div>
    </section>

    <section class="pp-seccion">
      <div class="contenedor revelar">
        <div class="pp-seccion__cab"><h2>Composición</h2><p class="nota" style="margin:var(--s2) 0 0">${esc(p.composicion.resumen)}</p></div>
        <div style="max-width:760px"><table class="tabla"><tbody>${filas}</tbody></table></div>
        <ul class="sellos">${sellos}</ul>
        <p class="leyenda" style="margin:var(--s7) 0 0">${esc(datos.sitio.leyenda)}</p>
      </div>
    </section>

    <section class="seccion otros-productos" aria-labelledby="titulo-otros">
      <div class="contenedor">
        <div class="encabezado-seccion"><h2 id="titulo-otros">Descubre también</h2></div>
        <div class="rejilla-productos">${otros}</div>
        <p style="text-align:center;margin:var(--s7) auto 0"><a class="btn btn--secundario" href="index.html#productos">Ver todos los productos</a></p>
      </div>
    </section>`;

    /* ---------- Barra fija inferior (móvil) ---------- */
    const barra = document.createElement("div");
    barra.className = "barra-fija";
    barra.innerHTML = `<div class="barra-fija__info"><small data-b-nombre></small><span class="precio" data-b-precio></span></div>
      <button class="btn btn--compra" type="button" data-pedir-ahora>Pedir ahora</button>`;
    document.body.appendChild(barra);

    /* ---------- Paquetes ---------- */
    const radios = HC.$$(".paquete", raiz);
    const btnWa = HC.$("#btn-wa", raiz);
    const mensajeWa = (nombrePaquete) => `¡Hola! Quiero pedir ${p.nombreCorto} – ${nombrePaquete}`;
    function seleccionar(c, enfocar) {
      clave = c;
      const q = HC.paquete(p, c);
      radios.forEach((r) => {
        const on = r.dataset.clave === c;
        r.setAttribute("aria-checked", String(on));
        r.tabIndex = on ? 0 : -1;
        if (on && enfocar) r.focus();
      });
      btnWa.href = HC.waUrl(datos, mensajeWa(q.nombre));
      HC.$("[data-b-nombre]", barra).textContent = `${p.nombreCorto} · ${q.nombre}`;
      HC.$("[data-b-precio]", barra).textContent = HC.fmt(q.precio);
    }
    radios.forEach((r) => r.addEventListener("click", () => seleccionar(r.dataset.clave)));
    HC.$(".paquetes", raiz).addEventListener("keydown", (e) => {
      const orden = ["uno", "duo", "trio"];
      let i = orden.indexOf(clave);
      if (["ArrowRight", "ArrowDown"].includes(e.key)) i = (i + 1) % 3;
      else if (["ArrowLeft", "ArrowUp"].includes(e.key)) i = (i + 2) % 3;
      else return;
      e.preventDefault();
      seleccionar(orden[i], true);
    });
    seleccionar(clave);

    const cuatro = HC.$("[data-wa-cuatro]", raiz);
    if (cuatro) cuatro.addEventListener("click", (e) => { e.preventDefault(); window.open(HC.waUrl(datos, `¡Hola! Quiero pedir 4 o más de ${p.nombreCorto}`), "_blank", "noopener"); });

    /* ---------- Agregar al carrito / pedir ahora ---------- */
    const btnAgregar = HC.$("#btn-agregar", raiz);
    let temporizador;
    btnAgregar.addEventListener("click", () => {
      const q = HC.paquete(p, clave);
      HC.carrito.agregar(p.id, q.n);
      btnAgregar.innerHTML = `${HC.icono.check}Agregado`;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => (btnAgregar.textContent = "Agregar al carrito"), 1800);
      HC.aviso(`${p.nombreCorto} – ${q.nombre} agregado`, { texto: "Ver carrito", href: "carrito.html" });
    });
    HC.$("[data-pedir-ahora]", barra).addEventListener("click", () => {
      HC.carrito.agregar(p.id, HC.paquete(p, clave).n);
      location.href = "carrito.html";
    });

    /* ---------- Galería ---------- */
    const pista = HC.$(".galeria__pista", raiz), mins = HC.$$(".miniatura", raiz), contador = HC.$(".galeria__contador", raiz);
    const total = p.fotos.length;
    let actual = 0;
    const ir = (i, suave) => { i = (i + total) % total; pista.scrollTo({ left: i * pista.clientWidth, behavior: suave === false ? "auto" : "smooth" }); };
    const marcar = (i) => {
      if (i === actual) return;
      actual = i;
      contador.textContent = `${i + 1} / ${total}`;
      mins.forEach((m, k) => (k === i ? m.setAttribute("aria-current", "true") : m.removeAttribute("aria-current")));
      mins[i].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    };
    let raf;
    pista.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => marcar(Math.round(pista.scrollLeft / pista.clientWidth))); }, { passive: true });
    mins.forEach((m) => m.addEventListener("click", () => ir(+m.dataset.i)));
    HC.$(".galeria__flecha--ant", raiz).addEventListener("click", () => ir(actual - 1));
    HC.$(".galeria__flecha--sig", raiz).addEventListener("click", () => ir(actual + 1));
    pista.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); ir(actual - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); ir(actual + 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirVisor(actual); }
    });
    window.addEventListener("resize", () => ir(actual, false));

    /* Visor ampliado (las fotos traen texto, así se leen mejor) */
    let visor, retorno;
    function abrirVisor(i) {
      retorno = document.activeElement;
      visor = document.createElement("div");
      visor.className = "visor";
      visor.setAttribute("role", "dialog"); visor.setAttribute("aria-modal", "true"); visor.setAttribute("aria-label", "Foto ampliada");
      const pintar = (k) => { visor.querySelector("img").src = p.fotos[k].src + ".webp"; visor.querySelector("img").alt = p.fotos[k].alt; visor.dataset.i = k; };
      visor.innerHTML = `<img alt=""><button class="visor__cerrar" type="button" aria-label="Cerrar foto">${HC.icono.cerrar}</button>
        <button class="galeria__flecha galeria__flecha--ant" style="display:grid" type="button" aria-label="Foto anterior">${HC.icono.izq}</button>
        <button class="galeria__flecha galeria__flecha--sig" style="display:grid" type="button" aria-label="Foto siguiente">${HC.icono.der}</button>`;
      document.body.appendChild(visor);
      pintar(i);
      document.body.style.overflow = "hidden";
      HC.$(".visor__cerrar", visor).focus();
      const mover = (d) => { const k = (+visor.dataset.i + d + total) % total; pintar(k); ir(k, false); };
      visor.addEventListener("click", (e) => {
        if (e.target.closest(".galeria__flecha--ant")) mover(-1);
        else if (e.target.closest(".galeria__flecha--sig")) mover(1);
        else if (!e.target.closest("img")) cerrarVisor();
      });
      visor.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarVisor();
        else if (e.key === "ArrowLeft") mover(-1);
        else if (e.key === "ArrowRight") mover(1);
        else if (e.key === "Tab") { const bs = HC.$$("button", visor); const a = document.activeElement; if (e.shiftKey && a === bs[0]) { e.preventDefault(); bs[bs.length - 1].focus(); } else if (!e.shiftKey && a === bs[bs.length - 1]) { e.preventDefault(); bs[0].focus(); } }
      });
    }
    function cerrarVisor() { if (!visor) return; visor.remove(); visor = null; document.body.style.overflow = ""; if (retorno) retorno.focus(); }
    HC.$$(".galeria__slide", raiz).forEach((s) => s.addEventListener("click", () => abrirVisor(+s.dataset.i)));

    /* ---------- Revisor de C.P. compacto ---------- */
    HC.montarChecker(HC.$("#revisor", raiz), { compacto: true });

    /* ---------- Datos estructurados (SEO) ---------- */
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product", name: p.nombre, description: p.metaDescripcion,
      image: p.fotos.map((f) => `${datos.sitio.dominio}/${f.src}.webp`),
      offers: { "@type": "Offer", priceCurrency: "MXN", price: String(p.precios.uno.precio), availability: "https://schema.org/InStock", url: `${datos.sitio.dominio}/${p.pagina}` }
    });
    document.head.appendChild(ld);

    document.body.classList.add("con-barra");
    HC.revelar(raiz);
  });
})();
