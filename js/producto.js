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
    const claves = HC.paquetesDe(p).map((x) => x.clave);
    let clave = claves.includes("trio") ? "trio" : claves[claves.length - 1]; // el paquete más grande viene preseleccionado (es el favorito)
    const favorito = clave;

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
        ${c === favorito && claves.length > 1 ? '<span class="etiqueta-favorito">Favorito</span>' : ""}
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
    const textoCuatro = c4 && c4.mostrarTexto
      ? `<p class="pp-cuatro">¿Quieres 4 o más? ${HC.fmt(c4.precio)} c/u. <a href="${c4.mercadoPago || '#'}" target="_blank" rel="noopener">Comprar aquí</a></p>` : "";

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

    const rs = p.resumen;
    const resumenHTML = rs ? `
            <div class="resumen-prod">
              ${rs.lema && rs.lema !== p.lema ? `<p class="resumen-prod__lema">${esc(rs.lema)}</p>` : ""}
              <div class="resumen-prod__fila"><strong>Apoya:</strong>
                <ul class="resumen-prod__apoya">${rs.apoya.map((x) => `<li>${HC.icono.checkFino}${esc(x)}</li>`).join("")}</ul></div>
              <p><strong>${esc(rs.ingredientesEtiqueta || "Ingredientes")}:</strong> ${esc(rs.ingredientes)}</p>
              <p class="resumen-prod__datos">${esc(rs.datos)}</p>
            </div>` : "";

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
            ${resumenHTML}
            <h2 id="titulo-paquete">Elige tu paquete</h2>
            <div class="paquetes" role="radiogroup" aria-labelledby="titulo-paquete">
              ${claves.map(tarjetaPaquete).join("")}
            </div>
            ${textoCuatro}
            <ul class="pp-envio">
              <li>${HC.icono.camion}Envío gratis en todos tus pedidos</li>
              <li>${HC.icono.tarjeta}Pago seguro con tarjeta · Hasta 24 meses</li>
              <li>${HC.icono.escudo}Producto 100% original</li>
            </ul>
            <div class="zona--compacta" id="revisor"></div>
            <div class="checkout-form" id="checkout-form" style="display:none">
              <h2 class="checkout__titulo">${HC.icono.camion}Completa tu pedido</h2>
              <form id="form-pedido" novalidate>
                <div class="checkout__campos">
                  <div class="checkout__campo">
                    <label for="ch-nombre">Nombre completo <span class="req">*</span></label>
                    <input id="ch-nombre" name="nombre" type="text" autocomplete="name" required placeholder="Tu nombre completo">
                  </div>
                  <div class="checkout__campo">
                    <label for="ch-tel">Teléfono <span class="req">*</span></label>
                    <input id="ch-tel" name="telefono" type="tel" inputmode="numeric" autocomplete="tel" required placeholder="10 dígitos" maxlength="15">
                  </div>
                  <div class="checkout__campo">
                    <label for="ch-colonia">Colonia <span class="req">*</span></label>
                    <select id="ch-colonia-sel" style="display:none"><option value="">Selecciona tu colonia</option></select>
                    <input id="ch-colonia" name="colonia" type="text" autocomplete="address-level3" required placeholder="Tu colonia">
                  </div>
                  <div class="checkout__campo">
                    <label for="ch-calle">Calle y número <span class="req">*</span></label>
                    <input id="ch-calle" name="calle" type="text" autocomplete="street-address" required placeholder="Ej. Av. Juárez 123">
                  </div>
                  <div class="checkout__campo">
                    <label for="ch-ref">Referencia <span class="opcional">(opcional)</span></label>
                    <input id="ch-ref" name="referencia" type="text" placeholder="Ej. Casa azul, entre calles...">
                  </div>
                </div>
                <div class="checkout__error" id="ch-error" role="alert"></div>
                <button class="btn btn--compra btn--bloque" type="submit" id="btn-comprar">COMPRAR AHORA</button>
                <div class="checkout__confianza">
                  ${HC.icono.candado}<span>Tus datos están protegidos · Pago seguro con Mercado Pago</span>
                </div>
              </form>
            </div>
            <a class="btn btn--wa-dudas btn--bloque" id="btn-wa" data-ubicacion="dudas_whatsapp" href="#" target="_blank" rel="noopener">${HC.icono.wa}¿Dudas? Escríbenos</a>
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
      <button class="btn btn--compra" type="button" data-pedir-ahora>Comprar ahora</button>`;
    document.body.appendChild(barra);

    /* ---------- Paquetes ---------- */
    const radios = HC.$$(".paquete", raiz);
    const btnWa = HC.$("#btn-wa", raiz);
    const mensajeWa = (nombrePaquete) => `¡Hola! Tengo una duda sobre ${p.nombreCorto} – ${nombrePaquete}`;
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
      btnWa.dataset.producto = p.nombreCorto;
      HC.$("[data-b-nombre]", barra).textContent = q.nombre;
      HC.$("[data-b-precio]", barra).textContent = HC.fmt(q.precio);
      actualizarBotonCompra();
    }
    /* ---------- Checker de zona + formulario de checkout ---------- */
    HC.montarChecker(HC.$("#revisor", raiz), { compacto: true });

    const checkoutForm = HC.$("#checkout-form", raiz);
    const formPedido = HC.$("#form-pedido", raiz);
    const chError = HC.$("#ch-error", raiz);
    const chColoniaSel = HC.$("#ch-colonia-sel", raiz);
    const chColoniaInput = HC.$("#ch-colonia", raiz);
    const btnPedirAhora = HC.$("[data-pedir-ahora]", barra);

    let zonaActual = null; // {cp, cubierto, estado, municipio, dias}

    /* Escuchar cuando el checker confirma cobertura */
    document.addEventListener("hc:zona", (e) => {
      zonaActual = e.detail;
      if (zonaActual && zonaActual.cubierto) {
        checkoutForm.style.display = "";
        cargarColonias(zonaActual.cp);
        checkoutForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        checkoutForm.style.display = "none";
      }
    });

    /* Si ya tenía zona guardada y es cubierta, mostrar formulario */
    const zonaPrevia = HC.zonaGuardada();
    if (zonaPrevia && zonaPrevia.cubierto) {
      zonaActual = zonaPrevia;
      checkoutForm.style.display = "";
      cargarColonias(zonaPrevia.cp);
    }

    async function cargarColonias(cp5) {
      try {
        const cols = await HC.colonias(cp5);
        if (cols && cols.length > 0) {
          chColoniaSel.innerHTML = '<option value="">Selecciona tu colonia</option>'
            + cols.map((c) => `<option value="${c}">${c}</option>`).join("")
            + '<option value="__otra__">Otra colonia...</option>';
          chColoniaSel.style.display = "";
          chColoniaInput.style.display = "none";
        } else {
          chColoniaSel.style.display = "none";
          chColoniaInput.style.display = "";
          chColoniaInput.value = "";
        }
      } catch (e) {
        chColoniaSel.style.display = "none";
        chColoniaInput.style.display = "";
      }
    }

    chColoniaSel.addEventListener("change", () => {
      if (chColoniaSel.value === "__otra__") {
        chColoniaSel.style.display = "none";
        chColoniaInput.style.display = "";
        chColoniaInput.value = "";
        chColoniaInput.focus();
      } else if (chColoniaSel.value) {
        chColoniaInput.value = chColoniaSel.value;
      }
    });

    /* Teléfono: solo números */
    HC.$("#ch-tel", raiz).addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });

    /* Enviar pedido por WhatsApp */
    formPedido.addEventListener("submit", (e) => {
      e.preventDefault();
      chError.textContent = "";

      if (!zonaActual || !zonaActual.cubierto) { mostrarError("Primero verifica tu código postal arriba."); return; }

      const nombre = HC.$("#ch-nombre", raiz).value.trim();
      const tel = HC.$("#ch-tel", raiz).value.trim();
      const colonia = chColoniaInput.value.trim() || (chColoniaSel.style.display !== "none" ? chColoniaSel.value : "");
      const calle = HC.$("#ch-calle", raiz).value.trim();
      const ref = HC.$("#ch-ref", raiz).value.trim();

      // Validaciones
      if (!nombre) { mostrarError("Escribe tu nombre completo."); HC.$("#ch-nombre", raiz).focus(); return; }
      if (!tel || tel.length < 10) { mostrarError("Escribe un teléfono de 10 dígitos."); HC.$("#ch-tel", raiz).focus(); return; }
      if (!colonia || colonia === "__otra__") { mostrarError("Selecciona o escribe tu colonia."); return; }
      if (!calle) { mostrarError("Escribe tu calle y número."); HC.$("#ch-calle", raiz).focus(); return; }

      const paq = HC.paquete(p, clave);

      const mensaje = [
        `¡Hola! Quiero hacer un pedido desde harmonclick.com`,
        ``,
        `📦 *${p.nombreCorto} – ${paq.nombre}* ($${Math.round(paq.precio)})`,
        ``,
        `👤 ${nombre}`,
        `📱 ${tel}`,
        `📍 CP ${zonaActual.cp} – ${colonia}, ${zonaActual.municipio}, ${zonaActual.estado}`,
        `🏠 ${calle}`,
        ref ? `📝 Ref: ${ref}` : "",
      ].filter(Boolean).join("\n");

      HC.registrarEvento("comprar_ahora", { producto: p.nombreCorto, paquete: paq.nombre, precio: paq.precio });

      window.open(HC.waUrl(datos, mensaje), "_blank", "noopener");
    });

    function mostrarError(msg) {
      chError.textContent = msg;
      chError.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function actualizarBotonCompra() {}

    btnPedirAhora.addEventListener("click", () => {
      const revisor = HC.$("#revisor", raiz);
      if (revisor) revisor.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    radios.forEach((r) => r.addEventListener("click", () => seleccionar(r.dataset.clave)));
    HC.$(".paquetes", raiz).addEventListener("keydown", (e) => {
      const orden = claves;
      let i = orden.indexOf(clave);
      if (["ArrowRight", "ArrowDown"].includes(e.key)) i = (i + 1) % orden.length;
      else if (["ArrowLeft", "ArrowUp"].includes(e.key)) i = (i + orden.length - 1) % orden.length;
      else return;
      e.preventDefault();
      seleccionar(orden[i], true);
    });
    seleccionar(clave);

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

    document.body.classList.add("con-barra");
    HC.revelar(raiz);
  });
})();
