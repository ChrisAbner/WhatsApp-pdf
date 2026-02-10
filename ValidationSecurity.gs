/**
 * ValidationSecurity.gs - Validaciones y seguridad del webhook.
 */

/**
 * Verifica que el token de verificación enviado por Meta coincida
 * con el almacenado en Script Properties.
 *
 * @param {string} token - Token recibido en el parámetro hub.verify_token.
 * @return {boolean} true si coincide, false en caso contrario.
 */
function verifyWebhookToken(token) {
  var config = getConfig();
  if (!config.VERIFY_TOKEN) {
    Logger.log('ERROR: VERIFY_TOKEN no configurado en Script Properties.');
    return false;
  }
  return token === config.VERIFY_TOKEN;
}

/**
 * Valida que el payload recibido del webhook tenga la estructura esperada
 * de la WhatsApp Cloud API y contenga al menos un mensaje de texto.
 *
 * @param {Object} body - Cuerpo del POST parseado como JSON.
 * @return {boolean} true si el payload es válido.
 */
function validateIncomingPayload(body) {
  if (!body || typeof body !== 'object') {
    Logger.log('Payload inválido: no es un objeto.');
    return false;
  }

  if (body.object !== 'whatsapp_business_account') {
    Logger.log('Payload inválido: object !== whatsapp_business_account');
    return false;
  }

  if (!body.entry || !Array.isArray(body.entry) || body.entry.length === 0) {
    Logger.log('Payload inválido: entry ausente o vacío.');
    return false;
  }

  var changes = body.entry[0].changes;
  if (!changes || !Array.isArray(changes) || changes.length === 0) {
    Logger.log('Payload inválido: changes ausente o vacío.');
    return false;
  }

  var value = changes[0].value;
  if (!value) {
    Logger.log('Payload inválido: value ausente.');
    return false;
  }

  // El payload es estructuralmente válido (puede ser status update u otro evento)
  return true;
}

/**
 * Verifica si el payload contiene mensajes entrantes (no status updates).
 *
 * @param {Object} body - Cuerpo del POST parseado como JSON.
 * @return {boolean} true si hay mensajes entrantes.
 */
function hasIncomingMessages(body) {
  var value = body.entry[0].changes[0].value;
  return value.messages && Array.isArray(value.messages) && value.messages.length > 0;
}

/**
 * Normaliza un número de teléfono eliminando caracteres no numéricos
 * y asegurando un formato consistente.
 *
 * WhatsApp envía los números en formato internacional sin '+' (ej: 521234567890).
 *
 * @param {string} phone - Número de teléfono sin procesar.
 * @return {string} Número de teléfono sanitizado (solo dígitos).
 */
function sanitizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  // Eliminar todo excepto dígitos
  return phone.replace(/\D/g, '');
}

/**
 * Sanitiza texto del usuario para evitar inyecciones en Sheets o logs.
 * Elimina caracteres de control y recorta a un tamaño razonable.
 *
 * @param {string} text - Texto del mensaje del usuario.
 * @return {string} Texto limpio.
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  // Eliminar caracteres de control excepto saltos de línea
  var clean = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Limitar longitud a 500 caracteres
  return clean.substring(0, 500).trim();
}
