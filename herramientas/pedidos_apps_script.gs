/* Harmon & Click: recibe los pedidos de la web, los guarda en la hoja "Pedidos" y avisa por correo.

PASOS (una sola vez):
 1. Crea una hoja de cálculo nueva en Google Sheets (sheets.new). Ponle de nombre "Pedidos web".
 2. En la hoja, menú Extensiones > Apps Script.
 3. Borra lo que aparezca y pega TODO este archivo. Guarda (ícono de disco).
 4. Botón Implementar > Nueva implementación. Tipo: "Aplicación web".
      - Descripción: Pedidos web
      - Ejecutar como: Yo (contacto.harmonclick@gmail.com)
      - Quién tiene acceso: Cualquier usuario
    Pulsa Implementar. La primera vez Google pide permisos: acéptalos
    (Ver detalles > Ir a ... > Permitir).
 5. Copia la "URL de la aplicación web" (termina en /exec).
 6. Pega esa URL en data/products.json, en "sitio" > "pedidosUrl". Guarda el cambio (commit).

Si cambias este código después: Implementar > Administrar implementaciones > lápiz > Versión: Nueva versión > Implementar.
La URL no cambia. */

const CORREO_AVISOS = "contacto.harmonclick@gmail.com";
const NOMBRE_HOJA = "Pedidos";
const COLUMNAS = ["Fecha", "Productos / paquetes", "Total", "Nombre", "WhatsApp", "Dirección completa", "Referencias", "Correo", "Método de pago", "Origen"];

function doPost(e) {
  try {
    const pedido = JSON.parse(e.postData.contents);
    // Anti-spam: el campo oculto "web_extra" solo lo llenan los robots. Aquí no se guarda nada.
    if (pedido.web_extra) return respuesta({ ok: false, error: "rechazado" });

    const nombre = String(pedido.nombre || "").trim();
    const whatsapp = String(pedido.whatsapp || "").replace(/\D/g, "");
    if (!nombre || whatsapp.length !== 10 || !pedido.productos || !pedido.direccion) {
      return respuesta({ ok: false, error: "Faltan datos del pedido" });
    }

    const fila = [
      Utilities.formatDate(new Date(), "America/Mexico_City", "yyyy-MM-dd HH:mm"),
      pedido.productos,
      Number(pedido.total) || 0,
      nombre,
      whatsapp,
      pedido.direccion,
      pedido.referencias || "",
      pedido.correo || "",
      pedido.pago || "",
      pedido.origen || "Web"
    ];

    // Primero se guarda la fila (es lo importante). El correo va aparte: si falla, el pedido ya quedó.
    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(15000);
    try {
      obtenerHoja().appendRow(fila.map(textoSeguro));
    } finally {
      bloqueo.releaseLock();
    }
    avisarPorCorreo(fila);
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  }
}

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
  }
  return hoja;
}

function avisarPorCorreo(fila) {
  try {
    const [fecha, productos, total, nombre, whatsapp, direccion, referencias, correo, pago, origen] = fila;
    const cuerpo = [
      "Nuevo pedido desde la web:", "",
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
      "Fecha: " + fecha + " · Origen: " + origen
    ].join("\n");
    MailApp.sendEmail(CORREO_AVISOS, "Nuevo pedido web: " + nombre + " ($" + total + ")", cuerpo);
  } catch (err) {
    // Sin correo (por ejemplo, se acabó la cuota diaria), el pedido sigue guardado en la hoja.
  }
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
