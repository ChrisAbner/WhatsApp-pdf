
// Mock PropertiesService
const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => {
      const props = {
        'WHATSAPP_TOKEN': 'EAAJ0ZChQSticBQmYY3IUPmDRLZBl2vm1oxGQHa3uqCIOECQ2nXEpCDpPzxhlmjCRlaG7xRC7gzS1ZCo11SDGdH2LxJKZBAL8a0qIu4nhZB5mNn8eoH7rb9lObQfeRAIZAnoswUKs2o9tO3gZAQ0GtnwWoBC6FWXPt4hnFwbTFlnnHZBP4yR9RZAUqx4kaDeneVmlNNQZAWlcDOha6lO5DkaBqilLAWYdrB6nlyiQ0sa3bH6ZAxxlpk8FvtZCB1kngytjugrGDZAtd0bMriS34ZAoEmaa1r',
        'VERIFY_TOKEN': 'chatpdf_verify_2024'
      };
      return props[key];
    }
  })
};

// Mock Logger
const Logger = {
  log: (msg) => console.log('[Logger]', msg)
};

// Mock ContentService
const ContentService = {
  createTextOutput: (content) => ({
    setMimeType: (mime) => ({ content, mime }),
    getContent: () => content
  }),
  MimeType: { TEXT: 'TEXT', JSON: 'JSON' }
};

// --- Injected Code from ValidationSecurity.gs ---

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    WHATSAPP_TOKEN:  props.getProperty('WHATSAPP_TOKEN'),
    VERIFY_TOKEN:    props.getProperty('VERIFY_TOKEN')
  };
}

function verifyWebhookToken(token) {
  var config = getConfig();
  if (!config.VERIFY_TOKEN) {
    Logger.log('ERROR: VERIFY_TOKEN no configurado en Script Properties.');
    return false;
  }
  return token === config.VERIFY_TOKEN;
}

// --- Injected Code from Code.gs ---

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

// --- Test Runner ---

console.log('--- Iniciando prueba local ---');

// Test Case 1: Correct Token
const eventSuccess = {
  parameter: {
    'hub.mode': 'subscribe',
    'hub.verify_token': 'chatpdf_verify_2024',
    'hub.challenge': 'CHALLENGE_ACCEPTED'
  }
};

console.log('\nPrueba 1: Credenciales Correctas');
const resultSuccess = doGet(eventSuccess);
console.log('Resultado:', resultSuccess.getContent ? resultSuccess.getContent() : resultSuccess);


// Test Case 2: Incorrect Token
const eventFail = {
  parameter: {
    'hub.mode': 'subscribe',
    'hub.verify_token': 'WRONG_TOKEN',
    'hub.challenge': 'CHALLENGE_ACCEPTED'
  }
};

console.log('\nPrueba 2: Token Incorrecto');
const resultFail = doGet(eventFail);
console.log('Resultado:', resultFail.getContent ? resultFail.getContent() : resultFail);
