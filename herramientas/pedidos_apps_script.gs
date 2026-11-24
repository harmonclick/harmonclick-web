/* Harmon & Click: recibe los pedidos de la web, los guarda en la hoja "Pedidos", crea el cobro en Mercado Pago
   (Checkout Pro) y anota en la hoja cuando el pago se aprueba.

PASOS PARA ACTUALIZAR (ya tienes la hoja "Pedidos web" funcionando):
 1. Abre la hoja "Pedidos web" > Extensiones > Apps Script.
 2. Borra todo el código y pega TODO este archivo. Guarda (ícono de disco).
 3. Pon tu Access Token de Mercado Pago (esto lo haces tú, nadie más debe verlo):
      - En Mercado Pago: Tu negocio > Configuración > Credenciales (o mercadopago.com.mx/developers > Tus integraciones).
        Crea una aplicación si te lo pide (tipo: Pagos en línea, Checkout Pro) y copia el "Access Token" de PRODUCCIÓN
        (empieza con APP_USR-).
      - En Apps Script: ícono de engrane (Configuración del proyecto) > Propiedades del script > Agregar propiedad.
        Propiedad: MP_ACCESS_TOKEN     Valor: (pega tu Access Token). Guarda.
 4. Implementar > Administrar implementaciones > lápiz > Versión: Nueva versión > Implementar.
    Si Google pide permisos nuevos, acéptalos. La URL no cambia.

Mientras MP_ACCESS_TOKEN no exista, la web sigue funcionando como antes: guarda el pedido y lo manda por WhatsApp.

PRIMERA VEZ (si todavía no tienes la hoja):
 1. Crea una hoja de cálculo nueva (sheets.new) llamada "Pedidos web" > Extensiones > Apps Script > pega este archivo.
 2. Implementar > Nueva implementación > Aplicación web. Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario.
 3. Copia la URL (termina en /exec) y pégala en data/products.json > "sitio" > "pedidosUrl".
 4. Sigue el paso 3 de arriba para el Access Token. */

const CORREO_AVISOS = "contacto.harmonclick@gmail.com";
const SITIO = "https://harmonclick.com";
const NOMBRE_HOJA = "Pedidos";
const COLUMNAS = ["Fecha", "Productos / paquetes", "Total", "Nombre", "WhatsApp", "Dirección completa", "Referencias", "Correo", "Método de pago", "Origen", "Pedido", "Estado del pago", "ID de pago Mercado Pago"];
const COL_PEDIDO = 11, COL_ESTADO = 12, COL_ID_PAGO = 13;   // columnas (empiezan en 1)
const ESTADOS = { approved: "Pagado", pending: "Pago pendiente", in_process: "Pago en revisión", rejected: "Pago rechazado", cancelled: "Pago cancelado", refunded: "Reembolsado", charged_back: "Contracargo" };

/* ---------- Entrada: pedidos de la web y avisos de Mercado Pago ---------- */
function doPost(e) {
  try {
    const cuerpo = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const p = e.parameter || {};
    // Aviso (webhook) de Mercado Pago: solo trae el ID; el estado real se pregunta a Mercado Pago
    if (p.origen === "mp" || cuerpo.type === "payment" || p.type === "payment" || p.topic === "payment") {
      const id = (cuerpo.data && cuerpo.data.id) || p["data.id"] || p.id;
      if (id) actualizarPago(String(id));
      return respuesta({ ok: true });
    }
    return recibirPedido(cuerpo);
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  }
}

/* La página gracias.html pregunta aquí el estado del pago al volver de Mercado Pago */
function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.accion === "estado" && p.pago) {
      const r = actualizarPago(String(p.pago));
      if (!r || (p.pedido && r.pedido !== p.pedido)) return respuesta({ ok: false, error: "pago no encontrado" });
      return respuesta({ ok: true, estado: r.estado, pedido: r.pedido });
    }
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  }
}

function recibirPedido(pedido) {
  // Anti-spam: el campo oculto "web_extra" solo lo llenan los robots. Aquí no se guarda nada.
  if (pedido.web_extra) return respuesta({ ok: false, error: "rechazado" });

  const nombre = String(pedido.nombre || "").trim().slice(0, 120);
  const whatsapp = String(pedido.whatsapp || "").replace(/\D/g, "");
  if (!nombre || whatsapp.length !== 10 || !pedido.direccion) return respuesta({ ok: false, error: "Faltan datos del pedido" });

  // El total SIEMPRE se calcula aquí con los precios publicados en la web (no se confía en lo que manda el navegador)
  let calc = null;
  if (Array.isArray(pedido.items) && pedido.items.length) {
    calc = calcularCarrito(pedido.items);
    if (!calc.lineas.length) return respuesta({ ok: false, error: "Carrito vacío" });
  } else if (!pedido.productos) {
    return respuesta({ ok: false, error: "Faltan datos del pedido" });
  }
  const productos = calc ? calc.resumen : String(pedido.productos);
  const total = calc ? calc.total : (Number(pedido.total) || 0);
  const idPedido = "HC-" + Utilities.formatDate(new Date(), "America/Mexico_City", "yyMMdd") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const correo = String(pedido.correo || "").trim();

  // ¿Se cobra en línea? Solo con Access Token, carrito calculado y zona con cobertura
  const token = PropertiesService.getScriptProperties().getProperty("MP_ACCESS_TOKEN");
  let urlPago = null, estado = "Por confirmar";
  if (token && calc && pedido.cubierto === true) {
    urlPago = crearCobro(token, idPedido, calc, nombre, whatsapp, correo);
    estado = "Esperando pago";
  }

  const fila = [
    Utilities.formatDate(new Date(), "America/Mexico_City", "yyyy-MM-dd HH:mm"),
    productos, total, nombre, whatsapp, String(pedido.direccion).slice(0, 400), String(pedido.referencias || "").slice(0, 400),
    correo, urlPago ? "Mercado Pago (en línea)" : String(pedido.pago || "Por confirmar por WhatsApp"),
    String(pedido.origen || "Web"), idPedido, estado, ""
  ];

  // Primero se guarda la fila (es lo importante). El correo va aparte: si falla, el pedido ya quedó.
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(15000);
  try { obtenerHoja().appendRow(fila.map(textoSeguro)); } finally { bloqueo.releaseLock(); }
  avisarPorCorreo("Nuevo pedido web" + (urlPago ? " (esperando pago)" : ""), fila);
  return respuesta({ ok: true, pedido: idPedido, total: total, pago: urlPago });
}

/* ---------- Precios: misma regla que el carrito de la web (js/app.js) ---------- */
function datosTienda() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get("productos");
  if (guardado) return JSON.parse(guardado);
  const r = UrlFetchApp.fetch(SITIO + "/data/products.json?t=" + Date.now(), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("No se pudieron leer los precios");
  const d = JSON.parse(r.getContentText());
  const datos = { productos: d.productos.map(function (p) { return { id: p.id, nombre: p.nombreCorto, precios: p.precios }; }), combo: d.sitio.combo };
  cache.put("productos", JSON.stringify(datos), 600);   // 10 minutos
  return datos;
}

function maxFrascos(p) {
  const pr = p.precios;
  if (pr.cuatroMas) return 99;
  return pr.trio ? 3 : pr.duo ? 2 : 1;
}

function precioLinea(p, qty) {
  const pr = p.precios;
  qty = Math.min(qty, maxFrascos(p));
  if (qty <= 1) return { qty: 1, total: pr.uno.precio, etiqueta: "1 frasco" };
  if (qty === 2) return { qty: 2, total: pr.duo.precio, etiqueta: "Dúo Bienestar" };
  if (qty === 3 && pr.trio) return { qty: 3, total: pr.trio.precio, etiqueta: "Trío Bienestar" };
  return { qty: qty, total: qty * pr.cuatroMas.precio, etiqueta: qty + " frascos a $" + pr.cuatroMas.precio + " c/u" };
}

function calcularCarrito(items) {
  const d = datosTienda();
  const lineas = [];
  items.slice(0, 20).forEach(function (it) {
    const p = d.productos.filter(function (x) { return x.id === String(it.id); })[0];
    const qty = Math.floor(Number(it.qty));
    if (!p || !(qty > 0) || lineas.some(function (l) { return l.id === p.id; })) return;
    const l = precioLinea(p, qty);
    lineas.push({ id: p.id, nombre: p.nombre, qty: l.qty, total: l.total, etiqueta: l.etiqueta, unidad: p.precios.uno.precio });
  });
  const qtyDe = function (id) { const l = lineas.filter(function (x) { return x.id === id; })[0]; return l ? l.qty : 0; };
  let descuento = 0;
  if (d.combo && d.combo.productos.every(function (id) { return qtyDe(id) === 1; })) {
    const suma = d.combo.productos.reduce(function (s, id) { return s + lineas.filter(function (x) { return x.id === id; })[0].unidad; }, 0);
    descuento = Math.max(0, suma - d.combo.precio);
  }
  const subtotal = lineas.reduce(function (s, l) { return s + l.total; }, 0);
  const resumen = lineas.map(function (l) { return l.nombre + " (" + l.etiqueta + ")"; }).join("; ") + (descuento ? "; " + d.combo.nombre + " −$" + descuento : "");
  return { lineas: lineas, descuento: descuento, total: subtotal - descuento, resumen: resumen };
}

/* ---------- Mercado Pago ---------- */
function crearCobro(token, idPedido, calc, nombre, whatsapp, correo) {
  const preferencia = {
    items: [{ id: idPedido, title: "Pedido Harmon & Click " + idPedido, description: calc.resumen.slice(0, 250), quantity: 1, unit_price: calc.total, currency_id: "MXN" }],
    payer: Object.assign({ name: nombre, phone: { area_code: "52", number: whatsapp } }, correo ? { email: correo } : {}),
    external_reference: idPedido,
    back_urls: { success: SITIO + "/gracias.html", pending: SITIO + "/gracias.html", failure: SITIO + "/gracias.html" },
    auto_return: "approved",
    notification_url: ScriptApp.getService().getUrl() + "?origen=mp",
    statement_descriptor: "HARMONCLICK"
  };
  const r = UrlFetchApp.fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + token, "X-Idempotency-Key": idPedido },
    payload: JSON.stringify(preferencia)
  });
  if (r.getResponseCode() >= 300) throw new Error("Mercado Pago no creó el cobro (" + r.getResponseCode() + ")");
  return JSON.parse(r.getContentText()).init_point;
}

/* Pregunta a Mercado Pago el estado real de un pago y lo anota en la hoja. Devuelve {pedido, estado} */
function actualizarPago(idPago) {
  const token = PropertiesService.getScriptProperties().getProperty("MP_ACCESS_TOKEN");
  if (!token || !/^\d+$/.test(idPago)) return null;
  const r = UrlFetchApp.fetch("https://api.mercadopago.com/v1/payments/" + idPago, { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const pago = JSON.parse(r.getContentText());
  const idPedido = String(pago.external_reference || "");
  if (!idPedido) return null;
  const estado = ESTADOS[pago.status] || pago.status;

  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(15000);
  try {
    const hoja = obtenerHoja();
    const pedidos = hoja.getRange(1, COL_PEDIDO, hoja.getLastRow(), 1).getValues();
    for (let i = pedidos.length - 1; i >= 1; i--) {
      if (String(pedidos[i][0]) !== idPedido) continue;
      const fila = i + 1;
      const anterior = hoja.getRange(fila, COL_ESTADO).getValue();
      hoja.getRange(fila, COL_ESTADO).setValue(estado);
      hoja.getRange(fila, COL_ID_PAGO).setValue(idPago);
      if (anterior !== estado && pago.status === "approved") {
        avisarPorCorreo("PAGO APROBADO $" + pago.transaction_amount + " · " + idPedido, hoja.getRange(fila, 1, 1, COLUMNAS.length).getValues()[0]);
      }
      break;
    }
  } finally { bloqueo.releaseLock(); }
  return { pedido: idPedido, estado: pago.status };
}

/* ---------- Hoja y avisos ---------- */
/* Si un texto empieza con = + - @, Sheets lo tomaría como fórmula. Le ponemos un apóstrofo delante para que se vea como texto. */
function textoSeguro(valor) {
  if (typeof valor === "string" && /^[=+\-@]/.test(valor)) return "'" + valor;
  return valor;
}

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(NOMBRE_HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  } else if (hoja.getLastColumn() < COLUMNAS.length) {
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]);   // agrega los títulos de las columnas nuevas
  }
  return hoja;
}

function avisarPorCorreo(asunto, fila) {
  try {
    const [fecha, productos, total, nombre, whatsapp, direccion, referencias, correo, pago, origen, pedido, estado] = fila;
    const cuerpo = [
      asunto, "",
      "Pedido: " + (pedido || "-") + " · Estado: " + (estado || "-"),
      "Productos: " + productos,
      "Total: $" + total + " MXN",
      "Pago: " + pago,
      "",
      "Nombre: " + nombre,
      "WhatsApp: " + whatsapp,
      "Dirección: " + direccion,
      "Referencias: " + (referencias || "Sin referencias"),
      "Correo: " + (correo || "No dio correo"),
      "",
      "Fecha: " + fecha + " · Origen: " + origen,
      "", "Antes de generar el pedido en Dropi, confirma la dirección con el cliente por WhatsApp."
    ].join("\n");
    MailApp.sendEmail(CORREO_AVISOS, asunto + ": " + nombre + " ($" + total + ")", cuerpo);
  } catch (err) {
    // Sin correo (por ejemplo, se acabó la cuota diaria), el pedido sigue guardado en la hoja.
  }
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
