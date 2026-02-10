/**
 * Code.gs - Punto de entrada del webhook de WhatsApp.
 *
 * Este archivo contiene las funciones doGet() y doPost() que Google Apps Script
 * expone automáticamente al desplegar como Web App.
 *
 * - doGet(): Maneja la verificación del webhook por parte de Meta.
 * - doPost(): Recibe mensajes entrantes de WhatsApp Cloud API.
 */

/**
 * Maneja peticiones GET. Meta envía un GET para verificar el webhook
 * durante la configuración inicial.
 *
 * Parámetros esperados de Meta:
 * - hub.mode: Debe ser "subscribe"
 * - hub.verify_token: Token de verificación que debe coincidir con el configurado
 * - hub.challenge: String que se debe devolver para completar la verificación
 *
 * @param {Object} e - Evento de la petición HTTP GET.
 * @return {GoogleAppsScript.Content.TextOutput} Respuesta con el challenge o error.
 */
function doGet(e) {
  var params = e.parameter;

  var mode = params['hub.mode'];
  var token = params['hub.verify_token'];
  var challenge = params['hub.challenge'];

  Logger.log('doGet recibido - mode: ' + mode + ', challenge: ' + challenge);

  if (mode === 'subscribe' && verifyWebhookToken(token)) {
    Logger.log('Webhook verificado correctamente.');
    return ContentService.createTextOutput(challenge);
  }

  Logger.log('Verificación fallida. Token no coincide o mode incorrecto.');
  return ContentService.createTextOutput('Verification failed')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Maneja peticiones POST. WhatsApp Cloud API envía un POST cada vez que
 * llega un mensaje nuevo o un evento de status.
 *
 * Flujo:
 * 1. Parsear el cuerpo JSON
 * 2. Validar la estructura del payload
 * 3. Verificar si hay mensajes entrantes (no status updates)
 * 4. Extraer información del contacto y mensaje
 * 5. Procesar el mensaje (gestionar contacto, detectar keywords, enviar PDFs)
 * 6. Retornar HTTP 200 para confirmar recepción a Meta
 *
 * IMPORTANTE: Siempre retornar HTTP 200 para evitar que Meta reintente el webhook.
 *
 * @param {Object} e - Evento de la petición HTTP POST.
 * @return {GoogleAppsScript.Content.TextOutput} Respuesta HTTP 200 con JSON.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    Logger.log('doPost recibido: ' + JSON.stringify(body).substring(0, 500));

    // Validar estructura del payload
    if (!validateIncomingPayload(body)) {
      Logger.log('Payload descartado: estructura inválida.');
      return createJsonResponse({ status: 'invalid_payload' });
    }

    // Verificar si es un mensaje (no status update)
    if (!hasIncomingMessages(body)) {
      Logger.log('Evento recibido sin mensajes (posiblemente status update).');
      return createJsonResponse({ status: 'no_messages' });
    }

    // Extraer información del contacto y mensaje
    var contactInfo = extractContactInfo(body);
    if (!contactInfo) {
      Logger.log('No se pudo extraer info de contacto del payload.');
      return createJsonResponse({ status: 'extraction_failed' });
    }

    Logger.log('Mensaje de ' + contactInfo.name + ' (' + contactInfo.phone + '): ' + contactInfo.messageText);

    // Procesar el mensaje
    handleMessage(contactInfo);

    return createJsonResponse({ status: 'processed' });

  } catch (error) {
    Logger.log('Error en doPost: ' + error.message + '\nStack: ' + error.stack);
    // Siempre retornar 200 para evitar reintentos de Meta
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

/**
 * Crea una respuesta JSON estándar.
 *
 * @param {Object} data - Datos a incluir en la respuesta.
 * @return {GoogleAppsScript.Content.TextOutput} Respuesta con Content-Type application/json.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
