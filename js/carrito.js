/* Carrito y pedido. El pedido se guarda en una Google Sheet con Apps Script (sitio.pedidosUrl en data/products.json).
   Si no se puede guardar, se abre WhatsApp con el mismo pedido para no perderlo. */
(function () {
  "use strict";
  const ESTADOS = ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila de Zaragoza", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz de Ignacio de la Llave", "Yucatán", "Zacatecas"];
  const OTRA = "__otra__";   // opción del menú de colonias: "Mi colonia no aparece"
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const telefono10 = (v) => String(v).replace(/\D/g, "");   // exactamente 10 dígitos (sin lada de país)

  /* Reglas de cada campo. zona: municipio y estado, que solo se escriben a mano si no encontramos el C.P. */
  const REGLAS = {
    nombre: { err: "Escribe tu nombre completo (nombre y apellido).", ok: (v) => v.trim().split(/\s+/).filter((x) => x.length > 1).length >= 2 },
    telefono: { err: "El teléfono debe tener 10 dígitos", ok: (v) => telefono10(v).length === 10 },
    cp: { err: "Escribe tu código postal de 5 dígitos.", ok: (v) => /^\d{5}$/.test(v) },
    calle: { err: "Escribe tu calle y número.", ok: (v) => v.trim().length >= 3 },
    colonia: { err: "Elige o escribe tu colonia.", ok: (v) => v.trim().length >= 2 },
    municipio: { err: "Escribe tu municipio o ciudad.", ok: (v) => v.trim().length >= 2, zona: true },
    estado: { err: "Escribe o elige tu estado.", ok: (v) => v.trim().length >= 3, zona: true },
    correo: { err: "Escribe un correo válido, por ejemplo nombre@correo.com", ok: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) }
  };

  const txt = (id, etiqueta, attrs, extra) => `
      <div class="campo">
        <label for="f-${id}">${etiqueta}</label>
        <input id="f-${id}" name="${id}" ${attrs} aria-describedby="e-${id}">
        <p class="error" id="e-${id}">${REGLAS[id].err}</p>${extra || ""}
      </div>`;

  const formularioHTML = () => `
    <form class="formulario" id="form-pedido" novalidate>
      ${txt("nombre", "Nombre completo", 'type="text" autocomplete="name" required aria-required="true"')}
      ${txt("telefono", "WhatsApp (10 dígitos)", 'type="tel" inputmode="numeric" autocomplete="tel-national" required aria-required="true"')}
      ${txt("cp", "Código postal", 'type="text" inputmode="numeric" autocomplete="postal-code" maxlength="5" required aria-required="true"', '<div id="estado-cp" aria-live="polite" style="margin-top:.5rem"></div>')}
      ${txt("calle", "Calle y número", 'type="text" autocomplete="address-line1" required aria-required="true"')}
      <div class="campo">
        <label for="f-colonia" id="l-colonia">Colonia</label>
        <select id="f-colonia-lista" name="colonia_lista" hidden aria-describedby="e-colonia"></select>
        <input id="f-colonia" name="colonia" type="text" autocomplete="address-line2" required aria-required="true" aria-describedby="e-colonia">
        <button class="enlace-campo" type="button" id="btn-colonia-lista" hidden>← Elegir de la lista</button>
        <p class="error" id="e-colonia">${REGLAS.colonia.err}</p>
      </div>
      <div id="bloque-zona" hidden>
        ${txt("municipio", "Municipio o ciudad", 'type="text" autocomplete="address-level2" required aria-required="true"')}
        ${txt("estado", "Estado", 'type="text" autocomplete="address-level1" list="estados" required aria-required="true"')}
      </div>
      <p class="zona-resumen" id="zona-resumen" hidden></p>
      <div class="extras-enlace" id="enlace-extras">
        <button class="enlace-campo" type="button" id="btn-extras" aria-expanded="false" aria-controls="bloque-extras">+ Agregar referencias o correo (opcional)</button>
      </div>
      <div id="bloque-extras" hidden>
        ${txt("correo", "Correo electrónico (opcional)", 'type="email" inputmode="email" autocomplete="email"')}
        <div class="campo">
          <label for="f-referencias">Referencias (opcional)</label>
          <textarea id="f-referencias" name="referencias" rows="3" autocomplete="off" placeholder="Ejemplo: portón negro, casa de dos pisos, entre Calle Hidalgo y Calle Morelos"></textarea>
        </div>
      </div>
      <datalist id="estados">${ESTADOS.map((e) => `<option value="${e}">`).join("")}</datalist>
      <div class="trampa" aria-hidden="true"><label>No llenes este campo<input type="text" name="web_extra" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn--compra btn--bloque" type="submit" id="btn-pedir">Pedir</button>
      <p class="privacidad">🔒 Tus datos solo se usan para enviar tu pedido.</p>
      <div id="pedido-error" aria-live="assertive"></div>
    </form>`;

  /* Forma de pago según la cobertura del C.P. */
  const pagoDe = (r) => (r && r.cubierto
    ? { texto: "Contra entrega, en efectivo al repartidor", clave: "contra_entrega" }
    : r ? { texto: "Pago anticipado (mi C.P. no tiene contra entrega); por favor envíenme los datos de pago", clave: "pago_anticipado" }
    : { texto: "Por confirmar", clave: "por_confirmar" });

  /* Mensaje de WhatsApp: el respaldo y el botón "Escribir por WhatsApp ahora" usan este mismo texto */
  const textoWhatsApp = (datos, v, c, r) => {
    const lineas = c.lineas.map((l) => `• ${l.producto.nombreCorto} – ${l.etiqueta}: ${HC.fmt(l.total)}`);
    return [
      "🛒 Pedido desde la web", "",
      "*Productos*", ...lineas,
      ...(c.comboAplicado ? [`🎁 ${c.comboNombre}: −${HC.fmt(c.descuentoCombo)}`] : []),
      "", `*Total a pagar: ${HC.fmt(c.total)}*`, "Envío: GRATIS", `Pago: ${pagoDe(r).texto}`,
      ...(r && r.cubierto ? [`Entrega estimada: ${r.dias}`] : []),
      "", "*Datos de entrega*",
      `👤 Nombre: ${v.nombre}`,
      `📱 Teléfono: ${telefono10(v.telefono)}`,
      ...(v.correo.trim() ? [`📧 Correo: ${v.correo.trim()}`] : []),
      `📍 C.P.: ${v.cp}`,
      `🏠 Calle y número: ${v.calle}`,
      `🏘️ Colonia: ${v.colonia}`,
      `🏙️ Municipio/ciudad: ${v.municipio}`,
      `🗺️ Estado: ${v.estado}`,
      `📝 Referencias: ${v.referencias || "Sin referencias"}`
    ].join("\n");
  };

  const resumenProductos = (c) => c.lineas.map((l) => `${l.producto.nombreCorto} (${l.etiqueta})`).join("; ")
    + (c.comboAplicado ? `; ${c.comboNombre} −${HC.fmt(c.descuentoCombo)}` : "");

  /* Envía el pedido a Apps Script. text/plain evita el preflight de CORS; la respuesta sí se puede leer. */
  const guardarPedido = async (url, pedido) => {
    if (!url) throw new Error("sin url de pedidos");
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), 20000);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(pedido), signal: control.signal });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "pedido rechazado");
    } finally { clearTimeout(espera); }
  };

  /* Abre WhatsApp sin que lo bloqueen: se llama directo desde el clic. Si el navegador lo impide, devuelve false. */
  const abrirWhatsApp = (url) => {
    const ventana = window.open(url, "_blank");
    if (ventana) { try { ventana.opener = null; } catch (err) { /* nada */ } }
    return !!ventana;
  };

  HC.listo.then((datos) => {
    const raiz = HC.$("#carrito-raiz");
    let zona = HC.zonaGuardada();
    HC.cobertura().catch(() => {});   // precarga: así el envío no espera la red

    function pintar() {
      const items = HC.carrito.leer();
      const calc = HC.calcular(datos, items);
      if (!calc.lineas.length) {
        raiz.innerHTML = `
          <div class="vacio">
            ${HC.icono.bolsa}
            <h2>Tu carrito está vacío</h2>
            <p>Cuando agregues un producto, aquí verás tu pedido.</p>
            <a class="btn" href="index.html#productos">Ver productos</a>
          </div>`;
        return;
      }
      const lineas = calc.lineas.map((l) => `
        <div class="linea" data-id="${l.id}">
          <a href="${l.producto.pagina}" aria-label="Ver ${l.producto.nombre}">${HC.foto(l.producto, 0)}</a>
          <div>
            <div class="linea__nombre"><a href="${l.producto.pagina}">${l.producto.nombre}</a></div>
            <div class="linea__paquete">${l.etiqueta}</div>
            <div class="linea__pie">
              <div class="cantidad" role="group" aria-label="Cantidad de frascos de ${l.producto.nombreCorto}">
                <button type="button" data-menos aria-label="Quitar un frasco">−</button>
                <output aria-live="polite">${l.qty}</output>
                <button type="button" data-mas aria-label="Agregar un frasco" ${l.qty >= l.max ? "disabled" : ""}>+</button>
              </div>
              <div class="linea__total">${HC.fmt(l.total)}${l.ahorro > 0 ? `<small>Ahorras ${HC.fmt(l.ahorro)}</small>` : ""}</div>
            </div>
            <button class="linea__quitar" type="button" data-quitar>Quitar del carrito</button>
          </div>
        </div>`).join("");

      const pagoTxt = !zona || zona.cubierto === undefined
        ? "Pagas en efectivo al repartidor cuando recibes tu pedido. Escribe tu C.P. para confirmar la cobertura."
        : zona.cubierto ? `Pago contra entrega: pagas en efectivo al repartidor. Entrega estimada: ${zona.dias}.`
        : "En tu zona el pago contra entrega todavía no está disponible. Te enviamos con pago anticipado y te damos los datos por WhatsApp.";

      raiz.innerHTML = `
      <div class="carrito-grid">
        <div>
          <section class="caja" aria-labelledby="t-productos">
            <h2 id="t-productos">Tus productos</h2>
            ${lineas}
            <p style="margin:var(--s3) 0 0"><button class="linea__quitar" type="button" data-vaciar>Vaciar carrito</button></p>
          </section>
          <section class="caja carrito-resumen" aria-labelledby="t-resumen">
            <h2 id="t-resumen">Resumen</h2>
            <div class="fila-resumen"><span>Productos (${calc.frascos} ${calc.frascos === 1 ? "frasco" : "frascos"})</span><span>${HC.fmt(calc.subtotal)}</span></div>
            ${calc.comboAplicado ? `<div class="fila-resumen fila-resumen--ahorro"><span>${calc.comboNombre}</span><span>−${HC.fmt(calc.descuentoCombo)}</span></div>` : ""}
            <div class="fila-resumen"><span>Envío</span><span><strong style="color:var(--verde-800)">Gratis</strong></span></div>
            <div class="fila-resumen fila-resumen--total"><span>Total a pagar</span><span class="precio">${HC.fmt(calc.total)}</span></div>
            ${calc.ahorroTotal > 0 ? `<p class="combo-aplicado">${calc.comboAplicado ? `¡Aplicamos el ${calc.comboNombre}! ` : ""}Con tus paquetes ahorras ${HC.fmt(calc.ahorroTotal)}.</p>` : ""}
            ${calc.distintos >= 2 ? `<p class="nota-combinados">${datos.sitio.notaCombinados}</p>` : ""}
            <button class="btn btn--compra btn--bloque" type="button" id="btn-finalizar" style="margin-top:var(--s5)">Finalizar compra</button>
            <p class="nota" style="margin:var(--s4) 0 0" id="nota-pago">${pagoTxt}</p>
          </section>
        </div>
        <div>
          <section class="caja" aria-labelledby="t-datos">
            <h2 id="t-datos">Datos de entrega</h2>
            ${formularioHTML()}
          </section>
        </div>
      </div>`;
      HC.pintarIconos(raiz);
      enlazar();
    }

    function enlazar() {
      // Cantidades
      HC.$$(".linea", raiz).forEach((el) => {
        const id = el.dataset.id;
        const qty = () => (HC.carrito.leer().find((x) => x.id === id) || { qty: 0 }).qty;
        HC.$("[data-menos]", el).addEventListener("click", () => { HC.carrito.poner(id, qty() - 1); pintar(); });
        HC.$("[data-mas]", el).addEventListener("click", () => { HC.carrito.poner(id, qty() + 1); pintar(); });
        HC.$("[data-quitar]", el).addEventListener("click", () => { HC.carrito.poner(id, 0); pintar(); });
      });
      HC.$("[data-vaciar]", raiz).addEventListener("click", () => { HC.carrito.vaciar(); pintar(); });

      /* ---------- Formulario ---------- */
      const form = HC.$("#form-pedido", raiz);
      const campo = (id) => form.elements[id];
      const cp = campo("cp"), nota = HC.$("#nota-pago", raiz), salida = HC.$("#estado-cp", form);
      const bloqueZona = HC.$("#bloque-zona", form), resumenZona = HC.$("#zona-resumen", form);
      const etiquetaColonia = HC.$("#l-colonia", form), btnLista = HC.$("#btn-colonia-lista", form);
      const enlaceExtras = HC.$("#enlace-extras", form), bloqueExtras = HC.$("#bloque-extras", form), btnExtras = HC.$("#btn-extras", form);
      const btnPedir = HC.$("#btn-pedir", form), errorEnvio = HC.$("#pedido-error", form);
      let coloniasCP = [];      // colonias del C.P. actual (vacío = la colonia se escribe a mano)
      let modoOtra = false;     // "Mi colonia no aparece": la colonia se escribe a mano
      let zonaManual = false;   // no encontramos el C.P.: municipio y estado a mano
      let zonaAuto = false;     // municipio y estado llenados desde la cobertura
      let enviando = false;
      let seq = 0;

      const usaLista = () => coloniasCP.length > 0 && !modoOtra;
      const elementoDe = (id) => (id === "colonia" && usaLista() ? campo("colonia_lista") : campo(id));
      const valor = (id) => (id === "colonia" && usaLista() ? campo("colonia_lista").value : campo(id).value.trim());

      const validar = (id, mostrar) => {
        if (REGLAS[id].zona && !zonaManual) return true;
        const bien = REGLAS[id].ok(valor(id));
        const el = elementoDe(id);
        if (mostrar || bien) el.setAttribute("aria-invalid", bien ? "false" : "true");
        return bien;
      };

      const pintarColonia = () => {
        const hayLista = coloniasCP.length > 0, verLista = usaLista();
        campo("colonia_lista").hidden = !verLista;
        campo("colonia_lista").disabled = !verLista;
        campo("colonia").hidden = verLista;
        campo("colonia").disabled = verLista;
        etiquetaColonia.htmlFor = verLista ? "f-colonia-lista" : "f-colonia";
        btnLista.hidden = !(hayLista && modoOtra);
      };
      const cargarColonias = (lista) => {
        coloniasCP = lista;
        modoOtra = false;
        campo("colonia_lista").innerHTML = lista.length
          ? `<option value="">Elige tu colonia</option>${lista.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}<option value="${OTRA}">Mi colonia no aparece</option>`
          : "";
        campo("colonia_lista").value = lista.length === 1 ? lista[0] : "";   // si solo hay una colonia, va elegida
        pintarColonia();
      };
      campo("colonia_lista").addEventListener("change", () => {
        if (campo("colonia_lista").value === OTRA) { modoOtra = true; pintarColonia(); campo("colonia").focus(); return; }
        validar("colonia", false);
      });
      btnLista.addEventListener("click", () => {
        modoOtra = false;
        campo("colonia_lista").value = "";
        pintarColonia();
        campo("colonia_lista").focus();
      });

      const mostrarExtras = (si) => {
        bloqueExtras.hidden = !si;
        enlaceExtras.hidden = si;
        btnExtras.setAttribute("aria-expanded", String(si));
      };
      btnExtras.addEventListener("click", () => { mostrarExtras(true); campo("correo").focus(); });

      Object.keys(REGLAS).forEach((id) => {
        const el = campo(id);
        el.addEventListener("input", () => validar(id, false));
        el.addEventListener("blur", () => { if (el.value || el.getAttribute("aria-invalid") === "true") validar(id, true); });
      });

      /* ---------- Código postal: municipio, estado, cobertura y colonias ---------- */
      const aviso = (clase, icono, texto) => {
        salida.innerHTML = `<div class="aviso ${clase}" style="padding:var(--s3)"><span data-i="${icono}"></span><div>${texto}</div></div>`;
        HC.pintarIconos(salida);
      };
      const mostrarZona = (r) => {
        if (r && r.cubierto) {
          aviso("aviso--ok", "checkCirculo", `<strong>¡Llegamos a tu zona!</strong> Pago contra entrega disponible. Entrega estimada: ${r.dias}.`);
          nota.textContent = `Pago contra entrega: pagas en efectivo al repartidor. Entrega estimada: ${r.dias}.`;
          campo("municipio").value = r.municipio;
          campo("estado").value = r.estado;
          resumenZona.textContent = `📍 ${r.municipio}, ${r.estado}`;
          zonaAuto = true;
          zonaManual = false;
        } else {
          if (zonaAuto) { campo("municipio").value = ""; campo("estado").value = ""; }
          zonaAuto = false;
          zonaManual = true;
          if (r) {
            aviso("aviso--info", "info", "<strong>Pago contra entrega no disponible aún en tu zona.</strong> Te enviamos con pago anticipado y tu asesora te da los datos por WhatsApp. El envío sigue siendo gratis.");
            nota.textContent = "En tu zona el pago contra entrega todavía no está disponible. Te enviamos con pago anticipado y te damos los datos por WhatsApp.";
          } else {
            aviso("aviso--info", "info", "<strong>No pudimos revisar tu C.P.</strong> Escribe tu municipio y estado; tu asesora te confirma la entrega por WhatsApp.");
            nota.textContent = "Escribe tu municipio y estado. Tu asesora te confirma la entrega por WhatsApp.";
          }
        }
        bloqueZona.hidden = !zonaManual;
        resumenZona.hidden = zonaManual;
        ["municipio", "estado"].forEach((id) => campo(id).removeAttribute("aria-invalid"));
      };
      const limpiarZona = () => {
        if (zonaAuto) { campo("municipio").value = ""; campo("estado").value = ""; }
        zonaAuto = false;
        zonaManual = false;
        bloqueZona.hidden = true;
        resumenZona.hidden = true;
        resumenZona.textContent = "";
        salida.innerHTML = "";
        nota.textContent = "Pagas en efectivo al repartidor cuando recibes tu pedido. Escribe tu C.P. para confirmar la cobertura.";
        cargarColonias([]);
      };
      const revisarCP = async (cpActual) => {
        const mi = ++seq;
        const [r, lista] = await Promise.all([HC.consultarCP(cpActual).catch(() => null), HC.colonias(cpActual)]);
        if (mi !== seq) return;   // ya cambió el C.P.
        zona = r;
        if (r) HC.guardarZona(r);
        mostrarZona(r);
        cargarColonias(lista);
      };
      cp.addEventListener("input", () => {
        cp.value = telefono10(cp.value).slice(0, 5);
        if (cp.value.length === 5) revisarCP(cp.value);
        else { seq++; limpiarZona(); }
      });
      cp.addEventListener("blur", () => {
        const n = HC.normalizarCP(cp.value);
        if (n && n !== cp.value) { cp.value = n; revisarCP(n); }
      });
      if (zona && zona.cp) { cp.value = zona.cp; revisarCP(zona.cp); }

      /* ---------- Pedir ---------- */
      const abrirRespaldo = (url, abrio) => {
        errorEnvio.innerHTML = `
          <div class="aviso aviso--error">
            <div>
              <strong>No pudimos registrar tu pedido en línea.</strong>
              <p>${abrio ? "Abrimos WhatsApp con tu pedido para que no se pierda." : "Toca el botón para enviar tu pedido por WhatsApp y no se pierda."}</p>
              <a class="btn btn--wa btn--bloque" href="${url}" target="_blank" rel="noopener" data-ubicacion="pedido_respaldo">${HC.icono.wa}Enviar pedido por WhatsApp</a>
            </div>
          </div>`;
        errorEnvio.scrollIntoView({ block: "center", behavior: "smooth" });
      };
      const mostrarGracias = (url) => {
        raiz.innerHTML = `
          <div class="caja gracias" role="status">
            <div class="aviso aviso--ok"><div><strong>✓ ¡Pedido recibido!</strong>Te escribimos por WhatsApp para confirmar tu entrega.</div></div>
            <a class="btn btn--wa btn--bloque" href="${url}" target="_blank" rel="noopener" data-ubicacion="pedido_confirmacion">${HC.icono.wa}Escribir por WhatsApp ahora</a>
            <p class="nota" style="text-align:center;margin:0"><a href="index.html#productos">Seguir comprando</a></p>
          </div>`;
        raiz.scrollIntoView({ block: "start", behavior: "smooth" });
      };

      const enviarPedido = async () => {
        if (enviando) return;
        errorEnvio.innerHTML = "";
        const errores = Object.keys(REGLAS).filter((id) => !validar(id, true));
        if (errores.includes("correo")) mostrarExtras(true);
        if (errores.length) {
          const primero = elementoDe(errores[0]);
          primero.scrollIntoView({ block: "center", behavior: "smooth" });
          primero.focus({ preventScroll: true });
          return;
        }

        const v = {};
        Object.keys(REGLAS).forEach((id) => (v[id] = valor(id)));
        v.correo = v.correo.trim();
        v.referencias = campo("referencias").value.trim();
        const c = HC.calcular(datos, HC.carrito.leer());
        const r = zona && zona.cp === v.cp ? zona : await HC.consultarCP(v.cp).catch(() => null);
        const pago = pagoDe(r);
        const nombres = c.lineas.map((l) => l.producto.nombreCorto).join(", ");
        const url = HC.waUrl(datos, textoWhatsApp(datos, v, c, r));
        const pedido = {
          productos: resumenProductos(c),
          total: c.total,
          nombre: v.nombre,
          whatsapp: telefono10(v.telefono),
          direccion: `${v.calle}, Col. ${v.colonia}, ${v.municipio}, ${v.estado}, C.P. ${v.cp}`,
          referencias: v.referencias,
          correo: v.correo,
          pago: pago.texto,
          origen: "Web (carrito)",
          web_extra: campo("web_extra").value   // trampa anti-spam: los robots la llenan
        };

        enviando = true;
        btnPedir.disabled = true;
        btnPedir.textContent = "Enviando…";
        const guardado = !pedido.web_extra && await guardarPedido(datos.sitio.pedidosUrl, pedido).then(() => true, () => false);

        if (guardado) {
          HC.registrarEvento("pedido_enviado", { producto: nombres, valor: c.total, metodo_pago: pago.clave, moneda: "MXN" });
          HC.carrito.vaciar();
          mostrarGracias(url);
          return;
        }
        const abrio = abrirWhatsApp(url);   // respaldo: el pedido no se pierde aunque falle el registro
        if (abrio) HC.registrarWhatsApp("pedido_respaldo", nombres);
        enviando = false;
        btnPedir.disabled = false;
        btnPedir.textContent = "Pedir";
        abrirRespaldo(url, abrio);
      };
      form.addEventListener("submit", (e) => { e.preventDefault(); enviarPedido(); });
      // "Finalizar compra" del resumen hace lo mismo que "Pedir"
      HC.$("#btn-finalizar", raiz).addEventListener("click", enviarPedido);
    }

    pintar();
    // Llegada desde "Comprar ahora" / "Finalizar compra" de la página de producto: directo al formulario
    if (location.hash === "#datos" && HC.$("#form-pedido", raiz)) {
      const primero = HC.$("#f-nombre", raiz);
      HC.$("#t-datos", raiz).scrollIntoView({ block: "start" });
      if (primero) primero.focus({ preventScroll: true });
    }
    window.addEventListener("storage", (e) => { if (e.key === "hc_carrito_v1") pintar(); });
  });
})();
