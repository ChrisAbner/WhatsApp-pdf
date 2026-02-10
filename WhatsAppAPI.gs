/**
 * WhatsAppAPI.gs - Integración con la WhatsApp Cloud API (Meta Graph API).
 */

/**
 * Envía un mensaje de texto simple a un número de WhatsApp.
 *
 * @param {string} phoneNumber - Número de teléfono del destinatario (formato internacional, solo dígitos).
 * @param {string} message     - Texto del mensaje a enviar.
 * @return {boolean} true si se envió correctamente.
 */
function sendTextMessage(phoneNumber, message) {
  var config = getConfig();

  var payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'text',
    text: {
      body: message
    }
  };

  return callWhatsAppAPI(config, payload);
}

/**
 * Envía un archivo multimedia (documento, imagen, video) a un número de WhatsApp
 * usando una URL pública como enlace.
 *
 * @param {string} phoneNumber - Número de teléfono del destinatario.
 * @param {string} mediaUrl    - URL pública del archivo a enviar.
 * @param {string} mediaType   - Tipo de media: "document", "image" o "video".
 * @param {string} caption     - Texto que acompaña al archivo (opcional para documents).
 * @param {string} fileName    - Nombre del archivo (solo para documents).
 * @return {boolean} true si se envió correctamente.
 */
function sendMediaMessage(phoneNumber, mediaUrl, mediaType, caption, fileName) {
  var config = getConfig();

  var mediaObject = {
    link: mediaUrl
  };

  if (caption) {
    mediaObject.caption = caption;
  }

  if (mediaType === 'document' && fileName) {
    mediaObject.filename = fileName;
  }

  var payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: mediaType
  };

  payload[mediaType] = mediaObject;

  return callWhatsAppAPI(config, payload);
}

/**
 * Marca un mensaje como leído en WhatsApp.
 *
 * @param {string} messageId - ID del mensaje recibido (wamid).
 * @return {boolean} true si se marcó correctamente.
 */
function markAsRead(messageId) {
  var config = getConfig();

  var payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId
  };

  return callWhatsAppAPI(config, payload);
}

/**
 * Realiza la llamada HTTP a la WhatsApp Cloud API.
 *
 * @param {Object} config  - Configuración con WHATSAPP_TOKEN y PHONE_NUMBER_ID.
 * @param {Object} payload - Cuerpo de la petición JSON.
 * @return {boolean} true si la llamada fue exitosa (HTTP 2xx).
 */
function callWhatsAppAPI(config, payload) {
  var url = 'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' +
            config.PHONE_NUMBER_ID + '/messages';

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.WHATSAPP_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      Logger.log('WhatsApp API: Mensaje enviado correctamente. Status: ' + code);
      return true;
    } else {
      Logger.log('WhatsApp API Error - Status: ' + code + ' - Body: ' + response.getContentText());
      return false;
    }
  } catch (e) {
    Logger.log('WhatsApp API Exception: ' + e.message);
    return false;
  }
}
