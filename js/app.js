/* Harmon & Click — código compartido por todas las páginas.
   Datos: data/products.json (precios y textos) y data/cobertura.json (códigos postales). */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const HC = (window.HC = {});
  const VERSION = "20261014c";   // lo actualiza herramientas/actualizar_version.py (evita datos viejos en caché)
  const CLAVE_CARRITO = "hc_carrito_v1";
  const CLAVE_ZONA = "hc_zona_v1";

  /* ---------- Utilidades ---------- */
  const guardaSeguro = {
    leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: seguimos sin guardar */ } }
  };
  HC.fmt = (n) => "$" + Math.round(n).toLocaleString("es-MX");
  HC.sinAcentos = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  HC.$ = (s, r) => (r || document).querySelector(s);
  HC.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Íconos ---------- */
  const I = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra || ""}>${d}</svg>`;
  HC.icono = {
    camion: I('<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>'),
    efectivo: I('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>'),
    escudo: I('<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/>'),
    chat: I('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    carrito: I('<path d="M3 4h2.4l2.2 11h10.2l2-8H6.2"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'),
    menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    cerrar: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    pin: I('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    checkFino: I('<path d="M6 12.5l4 4 8-9"/>'),
    checkCirculo: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>'),
    alerta: I('<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4v.01"/>'),
    mas: I('<path d="M12 5v14M5 12h14"/>'),
    izq: I('<path d="M15 5l-7 7 7 7"/>'),
    der: I('<path d="M9 5l7 7-7 7"/>'),
    flecha: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    candado: I('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    reloj: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    correo: I('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M4 7.5l8 6 8-6"/>'),
    telefono: I('<path d="M5 4.5h3.5l1.6 4-2 1.3a11 11 0 0 0 5.1 5.1l1.3-2 4 1.6V18a2 2 0 0 1-2 2A14.5 14.5 0 0 1 3 6.5a2 2 0 0 1 2-2z"/>'),
    facebook: I('<path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.4l.6-3.5H14V8.8c0-.2.1-.3.3-.3z"/>'),
    bolsa: I('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.7.63.72.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.88 9.88M20.46 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42"/></svg>'
  };
  HC.pintarIconos = (raiz) => HC.$$("[data-i]", raiz).forEach((el) => { if (!el.firstChild && HC.icono[el.dataset.i]) el.innerHTML = HC.icono[el.dataset.i]; });

  /* ---------- Datos ---------- */
  let promesaDatos;
  HC.datos = () => {
    if (!promesaDatos) {
      promesaDatos = fetch("data/products.json?v=" + VERSION).then((r) => { if (!r.ok) throw new Error("datos"); return r.json(); });
    }
    return promesaDatos;
  };
  HC.producto = (datos, id) => datos.productos.find((p) => p.id === id);

  /* ---------- WhatsApp ---------- */
  HC.waUrl = (datos, texto) => `https://wa.me/${datos.sitio.whatsapp}?text=${encodeURIComponent(texto)}`;
  /* Botones generales de WhatsApp: abren el chat con el mensaje de bienvenida (sitio.mensajeWhatsApp). El pedido del carrito usa su propio mensaje. */
  HC.waGeneral = (datos) => HC.waUrl(datos, datos.sitio.mensajeWhatsApp);

  /* ---------- Paquetes y precios ---------- */
  HC.PAQUETES = [
    { clave: "uno", nombre: "1 frasco", n: 1 },
    { clave: "duo", nombre: "Dúo Bienestar", n: 2 },
    { clave: "trio", nombre: "Trío Bienestar", n: 3 }
  ];
  HC.precioUnitario = (p) => p.precios.uno.precio;
  HC.paquete = (p, clave) => {
    const def = HC.PAQUETES.find((x) => x.clave === clave);
    const precio = p.precios[clave].precio;
    const normal = p.precios.uno.precio * def.n;
    return { ...def, precio, cadaUno: Math.round(precio / def.n), ahorro: Math.max(0, normal - precio), antes: p.precios[clave].antes || null, frase: p.precios[clave].frase || "" };
  };
  /* Precio de una línea del carrito según la cantidad de frascos del MISMO producto */
  HC.precioLinea = (p, qty) => {
    const pr = p.precios;
    let total, etiqueta;
    if (qty <= 1) { total = pr.uno.precio; etiqueta = "1 frasco"; }
    else if (qty === 2) { total = pr.duo.precio; etiqueta = "Dúo Bienestar"; }
    else if (qty === 3) { total = pr.trio.precio; etiqueta = "Trío Bienestar"; }
    else { total = qty * pr.cuatroMas.precio; etiqueta = `${qty} frascos a ${HC.fmt(pr.cuatroMas.precio)} c/u`; }
    const normal = pr.uno.precio * Math.max(qty, 1);
    return { total, etiqueta, ahorro: Math.max(0, normal - total) };
  };
  /* Calcula todo el carrito: líneas, Combo Ella & Él, totales */
  HC.calcular = (datos, items) => {
    const lineas = items
      .map((it) => ({ it, p: HC.producto(datos, it.id) }))
      .filter((x) => x.p && x.it.qty > 0)
      .map(({ it, p }) => ({ id: p.id, producto: p, qty: it.qty, ...HC.precioLinea(p, it.qty) }));
    const combo = datos.sitio.combo;
    const qtyDe = (id) => (lineas.find((l) => l.id === id) || { qty: 0 }).qty;
    let descuentoCombo = 0, comboAplicado = false;
    if (combo.productos.every((id) => qtyDe(id) === 1)) {
      const suma = combo.productos.reduce((s, id) => s + HC.producto(datos, id).precios.uno.precio, 0);
      descuentoCombo = Math.max(0, suma - combo.precio);
      comboAplicado = descuentoCombo > 0;
    }
    const subtotal = lineas.reduce((s, l) => s + l.total, 0);
    const total = subtotal - descuentoCombo;
    const ahorroTotal = lineas.reduce((s, l) => s + l.ahorro, 0) + descuentoCombo;
    return { lineas, comboAplicado, descuentoCombo, comboNombre: combo.nombre, subtotal, total, ahorroTotal, distintos: lineas.length, frascos: lineas.reduce((s, l) => s + l.qty, 0) };
  };

  /* ---------- Carrito (localStorage) ---------- */
  HC.carrito = {
    leer() {
      const v = guardaSeguro.leer(CLAVE_CARRITO);
      return Array.isArray(v) ? v.filter((x) => x && typeof x.id === "string" && x.qty > 0) : [];
    },
    guardar(items) { guardaSeguro.escribir(CLAVE_CARRITO, items); HC.actualizarContador(); document.dispatchEvent(new CustomEvent("hc:carrito")); },
    agregar(id, n) {
      const items = this.leer();
      const it = items.find((x) => x.id === id);
      if (it) it.qty = Math.min(99, it.qty + n); else items.push({ id, qty: n });
      this.guardar(items);
    },
    poner(id, qty) {
      let items = this.leer();
      if (qty <= 0) items = items.filter((x) => x.id !== id);
      else { const it = items.find((x) => x.id === id); if (it) it.qty = Math.min(99, qty); }
      this.guardar(items);
    },
    vaciar() { this.guardar([]); },
    contar() { return this.leer().reduce((s, x) => s + x.qty, 0); }
  };
  HC.actualizarContador = () => {
    const n = HC.carrito.contar();
    HC.$$("[data-contador]").forEach((el) => {
      const antes = el.textContent;
      el.textContent = n;
      el.dataset.vacio = n === 0 ? "true" : "false";
      if (antes !== String(n)) { el.classList.remove("salto"); void el.offsetWidth; el.classList.add("salto"); }
    });
    HC.$$("[data-carrito-enlace]").forEach((a) => a.setAttribute("aria-label", n ? `Carrito, ${n} ${n === 1 ? "frasco" : "frascos"}` : "Carrito, vacío"));
    HC.actualizarBarraCarrito();
  };

  /* ---------- Barra fija "Ver mi pedido (N) · $TOTAL →" ---------- */
  HC.actualizarBarraCarrito = () => {
    if (!HC._datos || document.body.dataset.pagina === "carrito") return;
    const calc = HC.calcular(HC._datos, HC.carrito.leer());
    let barra = HC.$(".barra-carrito");
    if (!calc.lineas.length) {
      if (barra) barra.remove();
      document.body.classList.remove("con-carro");
      return;
    }
    if (!barra) {
      barra = document.createElement("a");
      barra.className = "barra-carrito";
      barra.href = "carrito.html";
      document.body.appendChild(barra);
    }
    barra.innerHTML = `<span>Ver mi pedido (${calc.frascos}) · ${HC.fmt(calc.total)}</span>${HC.icono.flecha}`;
    document.body.classList.add("con-carro");
  };

  /* ---------- Aviso emergente ---------- */
  let temporizadorToast;
  HC.aviso = (texto, enlace) => {
    let t = HC.$(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = `<span></span>`;
    t.firstChild.textContent = texto;
    if (enlace) { const a = document.createElement("a"); a.href = enlace.href; a.textContent = enlace.texto; t.appendChild(a); }
    requestAnimationFrame(() => (t.dataset.visible = "true"));
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => (t.dataset.visible = "false"), 4200);
  };

  /* ---------- Código postal / cobertura ---------- */
  HC.normalizarCP = (valor) => {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.length === 0 || d.length > 5) return null;
    return d.padStart(5, "0");
  };
  let promesaCob;
  HC.cobertura = () => {
    if (!promesaCob) {
      promesaCob = fetch("data/cobertura.json?v=" + VERSION).then((r) => { if (!r.ok) throw new Error("cobertura"); return r.json(); }).then((d) => {
        const mapa = new Map();
        d.grupos.forEach(([e, muni, rangos]) => {
          for (let i = 0; i < rangos.length; i += 2) {
            for (let c = rangos[i]; c < rangos[i] + rangos[i + 1]; c++) mapa.set(c, [e, muni]);
          }
        });
        HC._cob = { estados: d.estados, mapa };
        return HC._cob;
      });
    }
    return promesaCob;
  };
  /* Devuelve {cp, cubierto, estado, municipio, lejana, dias} */
  const resolverCP = (cob, datos, cp5) => {
    const fila = cob.mapa.get(parseInt(cp5, 10));
    if (!fila) return { cp: cp5, cubierto: false };
    const estado = cob.estados[fila[0]];
    const lejanas = datos.sitio.zonasLejanas.map(HC.sinAcentos);
    const lejana = lejanas.includes(HC.sinAcentos(estado));
    return { cp: cp5, cubierto: true, estado, municipio: fila[1], lejana, dias: lejana ? datos.sitio.diasLejanas : datos.sitio.diasNormal };
  };
  HC.consultarCP = async (cp5) => {
    const [cob, datos] = await Promise.all([HC.cobertura(), HC.datos()]);
    return resolverCP(cob, datos, cp5);
  };
  /* Versión síncrona (solo si la cobertura ya se cargó): sirve para no perder el permiso del clic al abrir WhatsApp */
  HC.consultarCPSync = (cp5) => (HC._cob && HC._datos ? resolverCP(HC._cob, HC._datos, cp5) : null);
  HC.zonaGuardada = () => guardaSeguro.leer(CLAVE_ZONA);
  HC.guardarZona = (z) => { guardaSeguro.escribir(CLAVE_ZONA, z); document.dispatchEvent(new CustomEvent("hc:zona", { detail: z })); };

  let contadorChecker = 0;
  HC.montarChecker = (contenedor, opciones) => {
    const o = Object.assign({ compacto: false, irAProductos: false }, opciones);
    const id = "cp-" + ++contadorChecker;
    contenedor.innerHTML = `
      <div class="zona-tarjeta">
        <div>
          <h2>¿Llegamos a tu zona?</h2>
          <p class="zona__sub">Escribe tu código postal y te respondemos al instante.</p>
        </div>
        <div class="cp-cuerpo">
          <form class="cp-form" novalidate>
            <div class="campo-cp">
              <label class="solo-lectores" for="${id}">Código postal</label>
              <span data-i="pin"></span>
              <input id="${id}" name="cp" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="Código postal" aria-describedby="${id}-r">
            </div>
            <button class="btn${o.compacto ? "" : " btn--compra"}" type="submit">Revisar</button>
          </form>
          <div class="cp-resultado" id="${id}-r" aria-live="polite"></div>
        </div>
      </div>`;
    HC.pintarIconos(contenedor);
    const input = HC.$("input", contenedor), form = HC.$("form", contenedor), salida = HC.$(".cp-resultado", contenedor);
    let secuencia = 0;

    const pintar = (clase, icono, titulo, cuerpoHTML) => {
      salida.innerHTML = `<div class="aviso ${clase}"><span data-i="${icono}"></span><div><strong>${titulo}</strong>${cuerpoHTML}</div></div>`;
      HC.pintarIconos(salida);
    };
    const revisar = async (cp5) => {
      const mi = ++secuencia;
      pintar("aviso--carga", "reloj", "Revisando tu zona…", "");
      let r;
      try { r = await HC.consultarCP(cp5); }
      catch (e) { if (mi === secuencia) pintar("aviso--error", "alerta", "No pudimos revisar tu zona en este momento", "<p>Inténtalo de nuevo o escríbenos por WhatsApp y con gusto te ayudamos.</p>"); return; }
      if (mi !== secuencia) return;
      HC.guardarZona(r);
      const datos = await HC.datos();
      if (r.cubierto) {
        pintar("aviso--ok", "checkCirculo", "¡Sí llegamos a tu zona!",
          `<p>En ${r.municipio}, ${r.estado} tienes <strong style="display:inline;font-size:inherit">pago contra entrega</strong>.</p>
           <p>Entrega estimada: <strong style="display:inline;font-size:inherit">${r.dias}</strong>.</p>
           ${o.irAProductos ? '<a class="enlace-flecha" href="#productos">Ver productos <span data-i="flecha"></span></a>' : ""}`);
      } else {
        const msg = `¡Hola! Mi código postal es ${cp5} y vi que no tiene pago contra entrega. Quiero información del envío con pago anticipado.`;
        pintar("aviso--info", "info", "Por ahora el pago contra entrega no llega a tu zona",
          `<p>Nuestra cobertura sigue creciendo. Mientras tanto, sí te lo enviamos con <strong style="display:inline;font-size:inherit">pago anticipado 100% confiable</strong>: te damos tu número de guía y tu link de rastreo, y el repartidor siempre te llama antes de entregar. El envío sigue siendo gratis.</p>
           <a class="btn btn--wa" href="${HC.waUrl(datos, msg)}" target="_blank" rel="noopener"><span data-i="wa"></span>Escríbenos por WhatsApp</a>`);
      }
    };
    const procesar = (forzar) => {
      let v = input.value.replace(/\D/g, "").slice(0, 5);
      if (v.length !== input.value.length) input.value = v;
      if (v.length === 5) return revisar(v);
      if (forzar) {
        const cp = HC.normalizarCP(v);
        if (!cp) { pintar("aviso--error", "alerta", "Escribe tu código postal", "<p>Son 5 números, por ejemplo 44100.</p>"); input.focus(); return; }
        input.value = cp;
        return revisar(cp);
      }
      secuencia++; salida.innerHTML = "";
    };
    input.addEventListener("input", () => procesar(false));
    input.addEventListener("focus", () => HC.cobertura().catch(() => {}), { once: true });
    form.addEventListener("submit", (e) => { e.preventDefault(); procesar(true); });
    const guardada = HC.zonaGuardada();
    if (guardada && guardada.cp) { input.value = guardada.cp; revisar(guardada.cp); }
    return { input, revisar };
  };

  /* ---------- Cabecera, pie y botón flotante ---------- */
  /* Cinta de anuncios: texto que corre sin parar de derecha a izquierda. Dos grupos idénticos para que el bucle no se note. */
  function cintaAnuncios() {
    const mensaje = "Envío GRATIS · Verifica tu C.P.";
    const repeticiones = 10;   // suficientes para cubrir pantallas anchas; el grupo se duplica para que el bucle no se note
    const grupo = (oculto) => `<ul class="anuncio__grupo"${oculto ? ' aria-hidden="true"' : ""}>${
      Array.from({ length: repeticiones }, (_, i) => `<li${oculto || i ? ' aria-hidden="true"' : ""}>${mensaje}</li>`).join("")}</ul>`;
    return `<div class="anuncio" role="region" aria-label="Aviso de la tienda"><div class="anuncio__pista">${grupo(false)}${grupo(true)}</div></div>`;
  }

  function armarPagina(datos) {
    const s = datos.sitio;
    const inicio = document.body.dataset.pagina === "inicio";
    const prefijo = inicio ? "" : "index.html";
    const enlaces = [
      ["productos", "Productos"],
      ["como-funciona", "Cómo comprar"]
    ];
    const actual = document.body.dataset.pagina === "producto" ? "productos" : "";
    const enFaq = document.body.dataset.pagina === "faq";
    const lista = () => enlaces.map(([id, t]) => `<a href="${prefijo}#${id}" data-seccion="${id}"${actual === id ? ' aria-current="true"' : ""}>${t}</a>`).join("")
      + `<a href="preguntas-frecuentes.html"${enFaq ? ' aria-current="true"' : ""}>Preguntas frecuentes</a>`;

    const cab = HC.$("[data-cabecera]");
    if (cab) {
      cab.outerHTML = `
${cintaAnuncios()}
      <header class="cabecera">
        <div class="contenedor cabecera__fila">
          <a class="cabecera__logo" href="index.html" aria-label="Harmon &amp; Click, ir al inicio"><img src="img/logos/logo-para-fondo-oscuro.webp" alt="Harmon &amp; Click" width="96" height="60"></a>
          <nav class="menu" aria-label="Principal">${lista()}</nav>
          <div class="cabecera__acciones">
            <a class="icono-btn" href="carrito.html" data-carrito-enlace aria-label="Carrito, vacío">${HC.icono.carrito}<span class="contador" data-contador data-vacio="true" aria-hidden="true">0</span></a>
            <button class="icono-btn burger" type="button" aria-expanded="false" aria-controls="menu-movil" aria-label="Abrir menú">${HC.icono.menu}</button>
          </div>
        </div>
        <nav class="menu-movil" id="menu-movil" aria-label="Menú móvil" hidden><div class="contenedor">${lista()}</div></nav>
      </header>`;
    }
    const pie = HC.$("[data-pie]");
    if (pie) {
      pie.outerHTML = `
      <footer class="pie sobre-oscuro">
        <div class="contenedor">
          <div class="pie__grid">
            <div class="pie__logo">
              <img src="img/logos/logo-con-lema-fondo-oscuro.webp" alt="Harmon &amp; Click. Todo lo que necesitas, a un click" width="230" height="159" loading="lazy">
            </div>
            <div>
              <h2>Contacto</h2>
              <ul>
                <li class="pie__contacto"><span class="pie__ico">${HC.icono.telefono}</span><a href="${HC.waGeneral(datos)}" target="_blank" rel="noopener">WhatsApp ${s.whatsappVisible}</a></li>
                <li class="pie__contacto"><span class="pie__ico">${HC.icono.correo}</span><a href="mailto:${s.correo}">${s.correo}</a></li>
                <li class="pie__contacto"><span class="pie__ico">${HC.icono.facebook}</span><a href="${s.facebook}" target="_blank" rel="noopener">${s.facebookTexto}</a></li>
                <li class="pie__horario">${s.horario}</li>
              </ul>
            </div>
            <div>
              <h2>Tienda</h2>
              <ul>
                <li><a href="${prefijo}#productos">Productos</a></li>
                <li><a href="${prefijo}#como-funciona">Cómo comprar</a></li>
                <li><a href="preguntas-frecuentes.html">Preguntas frecuentes</a></li>
                <li><a href="aviso-de-privacidad.html">Aviso de privacidad</a></li>
              </ul>
            </div>
          </div>
          <div class="pie__legal">
            <p>${s.leyenda}</p>
            <p>© Harmon &amp; Click. Tienda 100% en línea. Todos los derechos reservados.</p>
            <p class="pie__seguro"><span class="pie__candado" aria-hidden="true">🔒</span> Sitio seguro · Conexión cifrada (HTTPS)</p>
          </div>
        </div>
      </footer>`;
    }
    if (!HC.$(".wa-flotante")) {
      const a = document.createElement("a");
      a.className = "wa-flotante";
      a.href = HC.waGeneral(datos);
      a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", "Escríbenos por WhatsApp");
      a.innerHTML = HC.icono.wa;
      document.body.appendChild(a);
    }
    // Menú móvil
    const burger = HC.$(".burger"), movil = HC.$("#menu-movil");
    if (burger && movil) {
      const cerrar = () => { movil.hidden = true; burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menú"); burger.innerHTML = HC.icono.menu; };
      burger.addEventListener("click", () => {
        const abrir = movil.hidden;
        movil.hidden = !abrir;
        burger.setAttribute("aria-expanded", String(abrir));
        burger.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
        burger.innerHTML = abrir ? HC.icono.cerrar : HC.icono.menu;
      });
      movil.addEventListener("click", (e) => { if (e.target.closest("a")) cerrar(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !movil.hidden) { cerrar(); burger.focus(); } });
    }
    // Resalta la sección visible (solo inicio)
    if (inicio && "IntersectionObserver" in window) {
      const mapa = {};
      HC.$$("[data-seccion]").forEach((a) => { (mapa[a.dataset.seccion] = mapa[a.dataset.seccion] || []).push(a); });
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          Object.keys(mapa).forEach((k) => mapa[k].forEach((a) => (k === e.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"))));
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(mapa).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
    const cabecera = HC.$(".cabecera");
    if (cabecera) {
      const marcar = () => cabecera.classList.toggle("con-borde", window.scrollY > 8);
      marcar();
      window.addEventListener("scroll", marcar, { passive: true });
    }
    HC.actualizarContador();
  }

  /* ---------- Acordeón ---------- */
  HC.montarAcordeon = (contenedor, items) => {
    if (!contenedor.querySelector(".acordeon__item")) {   // si el HTML ya trae las preguntas (para Google), no se vuelven a dibujar
      contenedor.classList.add("acordeon");
      const fila = (it, i) => `
      <div class="acordeon__item">
        <h3 style="margin:0;font-size:inherit"><button class="acordeon__boton" type="button" aria-expanded="false" aria-controls="faq-p${i}" id="faq-b${i}">${it.p}${HC.icono.mas}</button></h3>
        <div class="acordeon__panel" id="faq-p${i}" role="region" aria-labelledby="faq-b${i}"><div><p>${it.r}</p></div></div>
      </div>`;
      const mitad = Math.ceil(items.length / 2);   // en escritorio: dos columnas independientes
      contenedor.innerHTML = `<div class="acordeon__col">${items.slice(0, mitad).map((it, i) => fila(it, i)).join("")}</div>
      <div class="acordeon__col">${items.slice(mitad).map((it, i) => fila(it, i + mitad)).join("")}</div>`;
    }
    contenedor.addEventListener("click", (e) => {
      const b = e.target.closest(".acordeon__boton");
      if (!b) return;
      const abierto = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", String(!abierto));
      document.getElementById(b.getAttribute("aria-controls")).dataset.abierto = String(!abierto);
    });
  };

  /* ---------- Fotos de producto ---------- */
  HC.foto = (p, i, opc) => {
    const o = Object.assign({ eager: false }, opc);
    const f = p.fotos[i];
    return `<div class="foto" style="--bg-img:url('../${f.src}-sm.webp')">
      <img src="${f.src}-sm.webp" alt="${f.alt.replace(/"/g, "&quot;")}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="520" height="693"></div>`;
  };
  /* Imagen de tarjeta de producto: área 4:5 que rellena (object-fit: cover) */
  HC.fotoTarjeta = (p, i, opc) => {
    const o = Object.assign({ eager: false }, opc);
    const f = p.fotos[i || 0];
    return `<div class="tarjeta__img"><img src="${f.src}-sm.webp" srcset="${f.src}-sm.webp 520w, ${f.src}.webp 1200w" sizes="(min-width:1000px) 280px, 46vw" alt="${f.alt.replace(/"/g, "&quot;")}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="520" height="650"></div>`;
  };

  /* ---------- Animación al hacer scroll ---------- */
  HC.revelar = (raiz) => {
    const els = HC.$$(".revelar:not(.visible)", raiz);
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("visible")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e, i) => { if (!e.style.getPropertyValue("--retraso")) e.style.setProperty("--retraso", (i % 4) * 80 + "ms"); io.observe(e); });
  };

  /* ---------- Arranque ---------- */
  HC.listo = HC.datos().then((datos) => { HC._datos = datos; armarPagina(datos); HC.actualizarBarraCarrito(); HC.pintarIconos(); HC.revelar(); return datos; });
  HC.listo.catch(() => {
    const cont = HC.$("main");
    if (cont) cont.insertAdjacentHTML("afterbegin", '<div class="contenedor" style="padding-block:2rem"><div class="aviso aviso--error"><span data-i="alerta"></span><div><strong>No pudimos cargar la tienda</strong><p>Actualiza la página o escríbenos por WhatsApp al +52 33 5331 0072.</p></div></div></div>');
    HC.pintarIconos();
  });
  window.addEventListener("storage", HC.actualizarContador);
  window.addEventListener("pageshow", HC.actualizarContador);
})();
