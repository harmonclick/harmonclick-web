/* Página a la que vuelve la persona después de pagar en Mercado Pago (Checkout Pro).
   Mercado Pago agrega a la dirección: payment_id, status (approved / pending / in_process / rejected / null) y external_reference (nuestro número de pedido).
   Aquí se muestra el resultado, se vacía el carrito si el pago quedó aprobado o pendiente, y se avisa a Apps Script para anotar el pago en la hoja. */
(function () {
  "use strict";
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  HC.listo.then(async (datos) => {
    const raiz = HC.$("#gracias-raiz"), titulo = HC.$("#g-titulo");
    const q = new URLSearchParams(location.search);
    const idPago = q.get("payment_id") || q.get("collection_id") || "";
    let estado = q.get("status") || q.get("collection_status") || "";
    const pedido = (q.get("external_reference") || "").slice(0, 30);
    let ultimo = null;
    try { ultimo = JSON.parse(sessionStorage.getItem("hc_ultimo_pedido") || "null"); } catch (e) { /* nada */ }
    const wa = (ultimo && ultimo.wa) || HC.waGeneral(datos);

    // Confirmar con Mercado Pago (a través de Apps Script) el estado real del pago; si no responde, se usa el de la dirección
    if (idPago && /^\d+$/.test(idPago) && datos.sitio.pedidosUrl) {
      try {
        const url = `${datos.sitio.pedidosUrl}?accion=estado&pago=${encodeURIComponent(idPago)}&pedido=${encodeURIComponent(pedido)}`;
        const j = await fetch(url).then((r) => r.json());
        if (j && j.ok && j.estado) estado = j.estado;
      } catch (e) { /* sin confirmación: se muestra el estado que mandó Mercado Pago */ }
    }

    const numero = pedido ? `<p>Tu número de pedido es <strong>${esc(pedido)}</strong>. Guárdalo por si necesitas escribirnos.</p>` : "";
    const btnWa = (texto) => `<a class="btn btn--wa btn--bloque" href="${wa}" target="_blank" rel="noopener" data-ubicacion="gracias_whatsapp">${HC.icono.wa}${texto}</a>`;
    const seguir = '<p class="nota" style="text-align:center;margin:0"><a href="index.html#productos">Seguir comprando</a></p>';

    if (estado === "approved") {
      HC.carrito.vaciar();
      titulo.textContent = "¡Gracias por tu compra!";
      raiz.innerHTML = `
        <div class="aviso aviso--ok"><div><strong>✓ ¡Pago recibido!</strong>Tu pago fue aprobado.</div></div>
        ${numero}
        <p>Te escribimos por WhatsApp para confirmar tu dirección antes de enviar tu pedido. Entrega estimada: ${esc(datos.sitio.diasNormal)} (zonas lejanas: ${esc(datos.sitio.diasLejanas)}).</p>
        ${btnWa("Escríbenos por WhatsApp")}
        <p class="nota" style="margin:0">Consulta nuestra <a href="garantia-y-devoluciones.html">garantía y devoluciones</a>.</p>
        ${seguir}`;
      HC.registrarEvento("purchase", { valor: ultimo && ultimo.total, moneda: "MXN", pedido: pedido });
      try { sessionStorage.removeItem("hc_ultimo_pedido"); } catch (e) { /* nada */ }
    } else if (estado === "pending" || estado === "in_process") {
      HC.carrito.vaciar();
      titulo.textContent = "Tu pago está pendiente";
      raiz.innerHTML = `
        <div class="aviso aviso--info"><div><strong>Tu pedido quedó registrado.</strong>El pago todavía no se acredita.</div></div>
        ${numero}
        <p>Si elegiste pagar en efectivo, completa el pago con tu ficha antes de que venza. Cuando Mercado Pago lo acredite, te escribimos por WhatsApp para confirmar tu envío.</p>
        ${btnWa("¿Dudas? Escríbenos")}
        ${seguir}`;
    } else if (idPago || estado) {
      titulo.textContent = "Tu pago no se completó";
      raiz.innerHTML = `
        <div class="aviso aviso--error"><div><strong>No se realizó ningún cobro.</strong>Tu carrito sigue guardado.</div></div>
        <p>Puedes intentarlo de nuevo con otra tarjeta u otro medio de pago.</p>
        <a class="btn btn--compra btn--bloque" href="carrito.html#datos">Volver a intentar el pago</a>
        ${btnWa("Escríbenos por WhatsApp")}`;
    } else {
      titulo.textContent = "Tu pedido";
      raiz.innerHTML = `
        <p>No encontramos información de un pago. Si ya pagaste, escríbenos con tu número de pedido y lo revisamos.</p>
        ${btnWa("Escríbenos por WhatsApp")}
        <a class="btn btn--secundario btn--bloque" href="carrito.html">Ver mi carrito</a>`;
    }
    HC.pintarIconos(raiz);
  });
})();
