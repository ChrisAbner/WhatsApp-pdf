/**
 * MessageProcessor.gs - Lógica de negocio: detección de palabras clave,
 * extracción de información de contacto y decisión de envío.
 */

/**
 * Extrae la información del contacto y el mensaje del payload del webhook.
 *
 * @param {Object} body - Cuerpo del webhook (ya validado).
 * @return {Object|null} Objeto con { name, phone, messageText, messageId } o null.
 */
function extractContactInfo(body) {
  try {
    var value = body.entry[0].changes[0].value;
    var message = value.messages[0];
    var contact = value.contacts[0];

    var name = contact.profile ? contact.profile.name : 'Sin nombre';
    var phone = sanitizePhoneNumber(message.from);
    var messageId = message.id;

    // Solo procesar mensajes de texto
    var messageText = '';
    if (message.type === 'text' && message.text) {
      messageText = message.text.body || '';
    }

    return {
      name: name,
      phone: phone,
      messageText: messageText,
      messageId: messageId
    };
  } catch (e) {
    Logger.log('Error extrayendo info de contacto: ' + e.message);
    return null;
  }
}

/**
 * Normaliza un texto para comparación: convierte a minúsculas,
 * elimina acentos y espacios extra.
 *
 * @param {string} text - Texto original.
 * @return {string} Texto normalizado.
 */
function normalizeText(text) {
  if (!text) return '';

  var normalized = text.toLowerCase().trim();

  // Reemplazar acentos comunes en español
  var accents = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
    'ñ': 'n'
  };

  for (var accent in accents) {
    normalized = normalized.split(accent).join(accents[accent]);
  }

  // Eliminar espacios múltiples
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Detecta si el texto del mensaje contiene alguna palabra clave configurada.
 * Busca coincidencias ordenando las claves de mayor a menor longitud
 * para priorizar frases más específicas.
 *
 * @param {string} messageText - Texto del mensaje del usuario.
 * @return {string|null} Palabra clave encontrada (normalizada) o null si no hay coincidencia.
 */
function detectKeyword(messageText) {
  var normalized = normalizeText(messageText);
  if (!normalized) return null;

  // Ordenar keywords por longitud descendente para priorizar frases más largas
  var keywords = Object.keys(KEYWORD_MAPPINGS).sort(function(a, b) {
    return b.length - a.length;
  });

  for (var i = 0; i < keywords.length; i++) {
    if (normalized.indexOf(keywords[i]) !== -1) {
      return keywords[i];
    }
  }

  return null;
}

/**
 * Determina si se debe enviar un PDF al usuario, verificando que no se
 * haya enviado previamente el mismo documento.
 *
 * @param {string} phone   - Número de teléfono sanitizado.
 * @param {string} keyword - Palabra clave normalizada.
 * @return {boolean} true si se debe enviar el PDF (no se ha enviado antes).
 */
function shouldSendPdf(phone, keyword) {
  return !wasPdfAlreadySent(phone, keyword);
}

/**
 * Procesa un mensaje entrante completo: gestiona contacto, detecta keywords,
 * y ejecuta la acción correspondiente (enviar PDF o respuesta genérica).
 *
 * @param {Object} contactInfo - Objeto retornado por extractContactInfo().
 */
function handleMessage(contactInfo) {
  var phone = contactInfo.phone;
  var name = contactInfo.name;
  var messageText = contactInfo.messageText;

  // 1. Marcar mensaje como leído
  markAsRead(contactInfo.messageId);

  // 2. Gestionar contacto en Sheets
  var existingContact = findContactByPhone(phone);
  if (!existingContact) {
    addNewContact(name, phone);
    Logger.log('Nuevo contacto registrado: ' + name + ' (' + phone + ')');
  } else {
    updateContactLastMessage(phone);
  }

  // 3. Si no hay texto (imagen, audio, etc.), enviar respuesta genérica
  if (!messageText) {
    sendTextMessage(phone, MESSAGES.GENERIC);
    return;
  }

  // 4. Detectar palabra clave
  var keyword = detectKeyword(messageText);

  if (!keyword) {
    // No se detectó keyword → respuesta genérica
    sendTextMessage(phone, MESSAGES.GENERIC);
    Logger.log('Sin keyword detectada para: "' + messageText + '"');
    return;
  }

  Logger.log('Keyword detectada: "' + keyword + '" de usuario: ' + phone);

  // 5. Verificar si ya se envió este PDF
  if (!shouldSendPdf(phone, keyword)) {
    sendTextMessage(phone, MESSAGES.ALREADY_SENT);
    Logger.log('PDF ya enviado anteriormente para keyword "' + keyword + '" a: ' + phone);
    return;
  }

  // 6. Obtener archivo de Drive
  var fileId = mapKeywordToFileId(keyword);
  if (!fileId) {
    sendTextMessage(phone, MESSAGES.FILE_NOT_FOUND);
    Logger.log('No se encontró fileId para keyword: ' + keyword);
    return;
  }

  var fileInfo = getFilePublicUrl(fileId);
  if (!fileInfo) {
    sendTextMessage(phone, MESSAGES.FILE_NOT_FOUND);
    Logger.log('No se pudo obtener URL pública para fileId: ' + fileId);
    return;
  }

  // 7. Enviar el archivo
  var mediaType = getWhatsAppMediaType(fileInfo.mimeType);
  var sent = sendMediaMessage(phone, fileInfo.url, mediaType, MESSAGES.PDF_SENT, fileInfo.fileName);

  if (sent) {
    // 8. Marcar como enviado en Sheets
    markPdfSent(phone, keyword);
    Logger.log('PDF enviado exitosamente a ' + phone + ' (keyword: ' + keyword + ')');
  } else {
    sendTextMessage(phone, MESSAGES.FILE_NOT_FOUND);
    Logger.log('Fallo al enviar PDF a ' + phone);
  }
}
