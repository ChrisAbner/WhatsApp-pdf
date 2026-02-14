function runDiagnostics() {
  var config = getConfig();
  
  // 1. Validar Configuración
  Logger.log('--- Iniciando Diagnóstico ---');
  Logger.log('Token presente: ' + (config.WHATSAPP_TOKEN ? 'SÍ' : 'NO'));
  Logger.log('Phone ID: ' + config.PHONE_NUMBER_ID);
  
  // 2. Probar Permisos de Drive
  var fileId = config.KEYWORD_PDF_CATALOGO;
  Logger.log('Probando acceso a archivo Drive ID: ' + fileId);
  try {
    var file = DriveApp.getFileById(fileId);
    var access = file.getSharingAccess();
    Logger.log('Acceso actual: ' + access);
    Logger.log('Nombre archivo: ' + file.getName());
  } catch (e) {
    Logger.log('ERROR DRIVE: ' + e.message);
  }

  // 3. Probar Envío de Mensaje Manual
  // CAMBIA ESTE NÚMERO POR EL TUYO REAL (con código de país, sin +)
  // Intento 2: Quitamos el '1' después del 52 porque tu captura de Meta lo muestra sin él.
  var testPhone = '522292505698';
  
  Logger.log('Intentando enviar mensaje de prueba a: ' + testPhone);
  
  var payload = {
    messaging_product: 'whatsapp',
    to: testPhone,
    type: 'text',
    text: { body: 'Mensaje de prueba de diagnóstico 🤖' }
  };
  
  var url = 'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + config.PHONE_NUMBER_ID + '/messages';
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + config.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    Logger.log('Respuesta HTTP: ' + response.getResponseCode());
    Logger.log('Cuerpo Respuesta: ' + response.getContentText());
  } catch (e) {
    Logger.log('ERROR API: ' + e.message);
  }
}
