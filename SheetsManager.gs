/**
 * SheetsManager.gs - Operaciones CRUD sobre Google Sheets para gestión de contactos.
 */

/**
 * Obtiene la hoja de contactos. Si no existe la hoja con el nombre
 * configurado, la crea con los encabezados correspondientes.
 *
 * @return {GoogleAppsScript.Spreadsheet.Sheet} La hoja de contactos.
 */
function getOrCreateSheet() {
  var config = getConfig();
  var ss = SpreadsheetApp.openById(config.SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 6).setValues([[
      'Nombre',
      'Teléfono',
      'Fecha Primer Contacto',
      'Fecha Último Mensaje',
      'PDF Enviado',
      'Última Frase Detectada'
    ]]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    Logger.log('Hoja "' + SHEET_NAME + '" creada con encabezados.');
  }

  return sheet;
}

/**
 * Busca un contacto por número de teléfono en la hoja.
 *
 * @param {string} phone - Número de teléfono sanitizado.
 * @return {Object|null} Objeto con { row, nombre, telefono, fechaPrimer, fechaUltimo, pdfEnviado, ultimaFrase }
 *                       o null si no se encuentra.
 */
function findContactByPhone(phone) {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();

  // Empezar en fila 1 (índice 1) para saltar encabezados
  for (var i = 1; i < data.length; i++) {
    var rowPhone = sanitizePhoneNumber(String(data[i][COLUMNS.TELEFONO - 1]));
    if (rowPhone === phone) {
      return {
        row:           i + 1, // Fila real en la hoja (base 1)
        nombre:        data[i][COLUMNS.NOMBRE - 1],
        telefono:      data[i][COLUMNS.TELEFONO - 1],
        fechaPrimer:   data[i][COLUMNS.FECHA_PRIMER - 1],
        fechaUltimo:   data[i][COLUMNS.FECHA_ULTIMO - 1],
        pdfEnviado:    data[i][COLUMNS.PDF_ENVIADO - 1],
        ultimaFrase:   data[i][COLUMNS.ULTIMA_FRASE - 1]
      };
    }
  }

  return null;
}

/**
 * Agrega un nuevo contacto a la hoja de cálculo.
 *
 * @param {string} name  - Nombre del contacto (profile name de WhatsApp).
 * @param {string} phone - Número de teléfono sanitizado.
 */
function addNewContact(name, phone) {
  var sheet = getOrCreateSheet();
  var now = new Date();

  sheet.appendRow([
    sanitizeText(name),
    phone,
    now,       // Fecha primer contacto
    now,       // Fecha último mensaje
    'No',      // PDF Enviado
    ''         // Última frase detectada
  ]);

  Logger.log('Nuevo contacto agregado: ' + phone);
}

/**
 * Actualiza la fecha del último mensaje de un contacto existente.
 *
 * @param {string} phone - Número de teléfono sanitizado.
 */
function updateContactLastMessage(phone) {
  var contact = findContactByPhone(phone);
  if (!contact) {
    Logger.log('No se encontró contacto para actualizar: ' + phone);
    return;
  }

  var sheet = getOrCreateSheet();
  sheet.getRange(contact.row, COLUMNS.FECHA_ULTIMO).setValue(new Date());
  Logger.log('Último mensaje actualizado para: ' + phone);
}

/**
 * Marca que un PDF fue enviado al contacto y registra la palabra clave.
 *
 * @param {string} phone   - Número de teléfono sanitizado.
 * @param {string} keyword - Palabra clave que disparó el envío.
 */
function markPdfSent(phone, keyword) {
  var contact = findContactByPhone(phone);
  if (!contact) {
    Logger.log('No se encontró contacto para marcar PDF: ' + phone);
    return;
  }

  var sheet = getOrCreateSheet();
  var currentPdf = contact.pdfEnviado || '';

  // Agregar la keyword a la lista de PDFs enviados (separados por coma)
  var sentList = currentPdf === 'No' || currentPdf === '' ? [] : currentPdf.split(', ');
  if (sentList.indexOf(keyword) === -1) {
    sentList.push(keyword);
  }

  sheet.getRange(contact.row, COLUMNS.PDF_ENVIADO).setValue(sentList.join(', '));
  sheet.getRange(contact.row, COLUMNS.ULTIMA_FRASE).setValue(sanitizeText(keyword));
  sheet.getRange(contact.row, COLUMNS.FECHA_ULTIMO).setValue(new Date());

  Logger.log('PDF marcado como enviado para ' + phone + ': ' + keyword);
}

/**
 * Verifica si un PDF específico ya fue enviado a un contacto.
 *
 * @param {string} phone   - Número de teléfono sanitizado.
 * @param {string} keyword - Palabra clave del PDF.
 * @return {boolean} true si ya se envió, false en caso contrario.
 */
function wasPdfAlreadySent(phone, keyword) {
  var contact = findContactByPhone(phone);
  if (!contact) {
    return false;
  }

  var currentPdf = contact.pdfEnviado || '';
  if (currentPdf === 'No' || currentPdf === '') {
    return false;
  }

  var sentList = currentPdf.split(', ');
  return sentList.indexOf(keyword) !== -1;
}
