/* Carrito y pedido por WhatsApp (sin servidor) */
(function () {
  "use strict";
  const ESTADOS = ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila de Zaragoza", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz de Ignacio de la Llave", "Yucatán", "Zacatecas"];
  const CAMPOS = [
    { id: "nombre", etiqueta: "Nombre completo", auto: "name", err: "Escribe tu nombre completo (nombre y apellido).", ok: (v) => v.trim().split(/\s+/).filter((x) => x.length > 1).length >= 2 },
    { id: "telefono", etiqueta: "Teléfono / WhatsApp", auto: "tel", tipo: "tel", modo: "tel", err: "El teléfono debe tener 10 dígitos", ok: (v) => telefono10(v).length === 10 },
    { id: "correo", etiqueta: "Correo electrónico", opcional: true, tipo: "email", auto: "email", modo: "email", err: "Escribe un correo válido, por ejemplo nombre@correo.com", ok: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
    { id: "cp", etiqueta: "Código postal", auto: "postal-code", modo: "numeric", max: 5, err: "Escribe tu código postal de 5 dígitos.", ok: (v) => /^\d{5}$/.test(v) },
    { id: "calle", etiqueta: "Calle y número", auto: "address-line1", err: "Escribe tu calle y número.", ok: (v) => v.trim().length >= 3 },
    { id: "colonia", etiqueta: "Colonia", auto: "address-line2", err: "Escribe tu colonia.", ok: (v) => v.trim().length >= 2 },
    { id: "municipio", etiqueta: "Municipio o ciudad", auto: "address-level2", err: "Escribe tu municipio o ciudad.", ok: (v) => v.trim().length >= 2 },
    { id: "estado", etiqueta: "Estado", auto: "address-level1", lista: "estados", err: "Escribe o elige tu estado.", ok: (v) => v.trim().length >= 3 },
    { id: "referencias", etiqueta: "Referencias", opcional: true, area: true, ph: "Ejemplo: portón negro, casa de dos pisos, entre Calle Hidalgo y Calle Morelos", ok: () => true }
  ];
  function telefono10(v) {
    return String(v).replace(/\D/g, "");   // exactamente 10 dígitos (sin lada de país)
  }

  HC.listo.then((datos) => {
    const raiz = HC.$("#carrito-raiz");
    let zona = HC.zonaGuardada();
    const editado = {}; // campos que la persona ya modificó a mano (no los pisamos al autocompletar)

    const campoHTML = (c) => `
      <div class="campo">
        <label for="f-${c.id}">${c.etiqueta}${c.opcional ? ' <span class="opcional">(opcional)</span>' : ""}</label>
        ${c.area
          ? `<textarea id="f-${c.id}" name="${c.id}" rows="3" autocomplete="off" ${c.ph ? `placeholder="${c.ph}"` : ""}></textarea>`
          : `<input id="f-${c.id}" name="${c.id}" type="${c.tipo || "text"}" ${c.modo ? `inputmode="${c.modo}"` : ""} ${c.auto ? `autocomplete="${c.auto}"` : ""} ${c.max ? `maxlength="${c.max}"` : ""} ${c.lista ? `list="${c.lista}"` : ""} ${c.opcional ? "" : 'required aria-required="true"'} aria-describedby="e-${c.id}">`}
        ${c.err ? `<p class="error" id="e-${c.id}">${c.err}</p>` : ""}
        ${c.id === "cp" ? '<div id="estado-cp" aria-live="polite" style="margin-top:.5rem"></div>' : ""}
      </div>`;

    HC.cobertura().catch(() => {});   // precarga: así el envío por WhatsApp no espera la red

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
                <button type="button" data-mas aria-label="Agregar un frasco">+</button>
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
            <form class="formulario" id="form-pedido" novalidate>
              ${campoHTML(CAMPOS[0])}
              ${campoHTML(CAMPOS[1])}
              ${campoHTML(CAMPOS[2])}
              ${campoHTML(CAMPOS[3])}
              ${campoHTML(CAMPOS[4])}
              <div class="fila-2">${campoHTML(CAMPOS[5])}${campoHTML(CAMPOS[6])}</div>
              ${campoHTML(CAMPOS[7])}
              <datalist id="estados">${ESTADOS.map((e) => `<option value="${e}">`).join("")}</datalist>
              ${campoHTML(CAMPOS[8])}
              <button class="btn btn--wa btn--bloque" type="submit" id="btn-confirmar">${HC.icono.wa}Confirmar pedido por WhatsApp</button>
              <p class="privacidad">🔒 Tus datos solo se usan para enviar tu pedido.</p>
              <div class="confirmacion" id="confirmacion" hidden></div>
            </form>
          </section>
        </div>
      </div>`;
      HC.pintarIconos(raiz);
      enlazar(calc);
    }

    function enlazar(calc) {
      // Cantidades
      HC.$$(".linea", raiz).forEach((el) => {
        const id = el.dataset.id;
        const qty = () => (HC.carrito.leer().find((x) => x.id === id) || { qty: 0 }).qty;
        HC.$("[data-menos]", el).addEventListener("click", () => { HC.carrito.poner(id, qty() - 1); pintar(); });
        HC.$("[data-mas]", el).addEventListener("click", () => { HC.carrito.poner(id, qty() + 1); pintar(); });
        HC.$("[data-quitar]", el).addEventListener("click", () => { HC.carrito.poner(id, 0); pintar(); });
      });
      HC.$("[data-vaciar]", raiz).addEventListener("click", () => { HC.carrito.vaciar(); pintar(); });

      const form = HC.$("#form-pedido", raiz);
      const campo = (id) => form.elements[id];
      const validar = (c, mostrar) => {
        const el = campo(c.id);
        let v = el.value;
        if (c.id === "cp") v = v.replace(/\D/g, "");
        const bien = c.ok(v);
        if (c.opcional && !c.err) return true;
        if (mostrar) el.setAttribute("aria-invalid", bien ? "false" : "true");
        else if (bien) el.setAttribute("aria-invalid", "false");
        return bien;
      };
      CAMPOS.forEach((c) => {
        const el = campo(c.id);
        el.addEventListener("input", () => { editado[c.id] = true; if (c.id === "cp") el.value = el.value.replace(/\D/g, "").slice(0, 5); validar(c, false); });
        el.addEventListener("blur", () => { if (el.value || el.getAttribute("aria-invalid")) validar(c, true); });
      });

      // C.P.: autocompleta estado y municipio y muestra la cobertura
      const salida = HC.$("#estado-cp", raiz), nota = HC.$("#nota-pago", raiz);
      const mostrarZona = (r) => {
        const aviso = (clase, icono, texto) => { salida.innerHTML = `<div class="aviso ${clase}" style="padding:var(--s3)"><span data-i="${icono}"></span><div>${texto}</div></div>`; HC.pintarIconos(salida); };
        if (r.cubierto) {
          aviso("aviso--ok", "checkCirculo", `<strong>¡Llegamos a tu zona!</strong> Pago contra entrega disponible. Entrega estimada: ${r.dias}.`);
          nota.textContent = `Pago contra entrega: pagas en efectivo al repartidor. Entrega estimada: ${r.dias}.`;
          if (!editado.estado) campo("estado").value = r.estado;
          if (!editado.municipio) campo("municipio").value = r.municipio;
          ["estado", "municipio"].forEach((k) => { if (campo(k).value) campo(k).setAttribute("aria-invalid", "false"); });
        } else {
          aviso("aviso--info", "info", "<strong>Pago contra entrega no disponible aún en tu zona.</strong> Te enviamos con pago anticipado y tu asesora te da los datos por WhatsApp. El envío sigue siendo gratis.");
          nota.textContent = "En tu zona el pago contra entrega todavía no está disponible. Te enviamos con pago anticipado y te damos los datos por WhatsApp.";
        }
      };
      let seq = 0;
      const revisarCP = async (cp) => {
        const mi = ++seq;
        try { const r = await HC.consultarCP(cp); if (mi !== seq) return; zona = r; HC.guardarZona(r); mostrarZona(r); return r; }
        catch (e) { if (mi === seq) salida.innerHTML = ""; }
      };
      campo("cp").addEventListener("input", () => {
        const v = campo("cp").value;
        if (v.length === 5) revisarCP(v); else { seq++; salida.innerHTML = ""; }
      });
      campo("cp").addEventListener("blur", () => {
        const n = HC.normalizarCP(campo("cp").value);
        if (n && n !== campo("cp").value) { campo("cp").value = n; revisarCP(n); }
      });
      if (zona && zona.cp) { campo("cp").value = zona.cp; revisarCP(zona.cp); }

      // Enviar por WhatsApp
      const mensaje = (v, r) => {
        const c = HC.calcular(datos, HC.carrito.leer());
        const lineas = c.lineas.map((l) => `• ${l.producto.nombreCorto} – ${l.etiqueta}: ${HC.fmt(l.total)}`);
        const pago = r && r.cubierto
          ? "Contra entrega, en efectivo al repartidor"
          : r ? "Pago anticipado (mi C.P. no tiene contra entrega); por favor envíenme los datos de pago"
          : "Por confirmar";
        const partes = [
          "🛒 Pedido desde la web", "",
          "*Productos*", ...lineas,
          ...(c.comboAplicado ? [`🎁 ${c.comboNombre}: −${HC.fmt(c.descuentoCombo)}`] : []),
          "", `*Total a pagar: ${HC.fmt(c.total)}*`, "Envío: GRATIS", `Pago: ${pago}`,
          ...(r && r.cubierto ? [`Entrega estimada: ${r.dias}`] : []),
          "", "*Datos de entrega*",
          `👤 Nombre: ${v.nombre.trim()}`,
          `📱 Teléfono: ${telefono10(v.telefono)}`,
          ...(v.correo.trim() ? [`📧 Correo: ${v.correo.trim()}`] : []),
          `📍 C.P.: ${v.cp}`,
          `🏠 Calle y número: ${v.calle.trim()}`,
          `🏘️ Colonia: ${v.colonia.trim()}`,
          `🏙️ Municipio/ciudad: ${v.municipio.trim()}`,
          `🗺️ Estado: ${v.estado.trim()}`,
          `📝 Referencias: ${v.referencias.trim() || "Sin referencias"}`
        ];
        return partes.join("\n");
      };
      /* Abre WhatsApp sin que lo bloqueen: se llama directo desde el clic (sin esperas antes).
         Si el navegador impide la ventana nueva, se navega en esta misma pestaña (eso nunca se bloquea). */
      const abrirWhatsApp = (url) => {
        const ventana = window.open(url, "_blank");
        if (ventana) { try { ventana.opener = null; } catch (err) { /* nada */ } return true; }
        window.location.href = url;
        return false;
      };
      const enviarPedido = () => {
        let primero = null;
        CAMPOS.forEach((c) => { if (!validar(c, true) && !primero) primero = campo(c.id); });
        if (primero) {
          primero.scrollIntoView({ block: "center", behavior: "smooth" });
          primero.focus({ preventScroll: true });
          return;
        }
        const v = {}; CAMPOS.forEach((c) => (v[c.id] = campo(c.id).value));
        v.cp = v.cp.replace(/\D/g, "");
        const r = zona && zona.cp === v.cp ? zona : HC.consultarCPSync(v.cp);   // sin esperar nada de la red
        const url = HC.waUrl(datos, mensaje(v, r));
        const abrio = abrirWhatsApp(url);
        const conf = HC.$("#confirmacion", form);
        conf.hidden = false;
        conf.innerHTML = `<p><strong>¡Listo! Abrimos WhatsApp con tu pedido.</strong></p>
          <p>Envía el mensaje para que tu asesora lo confirme. Tu carrito se queda guardado por si necesitas ajustar algo.</p>
          <p><a href="${url}" target="_blank" rel="noopener">${abrio ? "¿No se abrió WhatsApp? Toca aquí." : "Toca aquí para abrir WhatsApp con tu pedido."}</a></p>`;
        if (abrio) conf.scrollIntoView({ block: "center", behavior: "smooth" });
      };
      form.addEventListener("submit", (e) => { e.preventDefault(); enviarPedido(); });
      // "Finalizar compra": valida todo y, si está bien, abre WhatsApp con el pedido (igual que "Confirmar pedido por WhatsApp")
      HC.$("#btn-finalizar", raiz).addEventListener("click", enviarPedido);
    }

    pintar();
    document.addEventListener("hc:carrito", () => { /* otros cambios (otra pestaña) */ });
    window.addEventListener("storage", (e) => { if (e.key === "hc_carrito_v1") pintar(); });
  });
})();
