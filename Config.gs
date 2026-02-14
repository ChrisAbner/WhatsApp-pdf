/**
 * Config.gs - Configuración centralizada del sistema de webhook WhatsApp.
 *
 * Todas las credenciales se almacenan en PropertiesService (Script Properties).
 * NUNCA hardcodear tokens ni IDs sensibles en el código.
 */

/**
 * Nombre de la hoja dentro de Google Sheets donde se almacenan contactos.
 */
var SHEET_NAME = 'Contactos';

/**
 * Índices de columnas en la hoja de contactos (base 1).
 */
var COLUMNS = {
  NOMBRE:              1,  // A
  TELEFONO:            2,  // B
  FECHA_PRIMER:        3,  // C
  FECHA_ULTIMO:        4,  // D
  PDF_ENVIADO:         5,  // E
  ULTIMA_FRASE:        6   // F
};

/**
 * Mapeo de palabras clave normalizadas a la propiedad de Script Properties
 * que contiene el ID del archivo en Google Drive.
 *
 * Las claves deben estar en minúsculas y sin acentos para facilitar
 * la comparación. La función detectKeyword() se encarga de normalizar
 * el texto del usuario antes de buscar aquí.
 */
var KEYWORD_MAPPINGS = {
  'catalogo':          'KEYWORD_PDF_CATALOGO',
  'enviar catalogo':   'KEYWORD_PDF_CATALOGO',
  'precios':           'KEYWORD_PDF_PRECIOS',
  'lista de precios':  'KEYWORD_PDF_PRECIOS'
};

/**
 * Mensajes de respuesta del sistema.
 */
var MESSAGES = {
  WELCOME:        '¡Hola! Gracias por contactarnos. Puedes pedirnos información escribiendo palabras como "catálogo" o "precios".',
  PDF_SENT:       '¡Listo! Aquí tienes el documento que solicitaste.',
  ALREADY_SENT:   'Ya te enviamos ese documento anteriormente. Si necesitas otro, escríbenos.',
  FILE_NOT_FOUND: 'Lo sentimos, el documento no está disponible en este momento. Inténtalo más tarde.',
  GENERIC:        'Gracias por tu mensaje. Escribe "catálogo" o "precios" para recibir información.'
};

/**
 * Versión de la API de WhatsApp Graph.
 */
var GRAPH_API_VERSION = 'v21.0';

/**
 * Retorna un objeto con las credenciales almacenadas en Script Properties.
 *
 * @return {Object} Objeto con WHATSAPP_TOKEN, PHONE_NUMBER_ID, VERIFY_TOKEN y SHEET_ID.
 */
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    WHATSAPP_TOKEN:  props.getProperty('WHATSAPP_TOKEN'),
    PHONE_NUMBER_ID: props.getProperty('PHONE_NUMBER_ID'),
    VERIFY_TOKEN:    props.getProperty('VERIFY_TOKEN'),
    SHEET_ID:             props.getProperty('SHEET_ID'),
    KEYWORD_PDF_CATALOGO: props.getProperty('KEYWORD_PDF_CATALOGO'),
    KEYWORD_PDF_PRECIOS:  props.getProperty('KEYWORD_PDF_PRECIOS')
  };
}

/**
 * Función de utilidad para configurar las propiedades del script.
 * Ejecutar UNA SOLA VEZ desde el editor de Apps Script, reemplazando
 * los valores de ejemplo con los reales.
 *
 * Después de ejecutar, se recomienda eliminar o comentar esta función
 * para evitar sobrescrituras accidentales.
 */
function setupConfiguration() {
  PropertiesService.getScriptProperties().setProperties({
    'WHATSAPP_TOKEN':       'EAAJ0ZChQSticBQmYY3IUPmDRLZBl2vm1oxGQHa3uqCIOECQ2nXEpCDpPzxhlmjCRlaG7xRC7gzS1ZCo11SDGdH2LxJKZBAL8a0qIu4nhZB5mNn8eoH7rb9lObQfeRAIZAnoswUKs2o9tO3gZAQ0GtnwWoBC6FWXPt4hnFwbTFlnnHZBP4yR9RZAUqx4kaDeneVmlNNQZAWlcDOha6lO5DkaBqilLAWYdrB6nlyiQ0sa3bH6ZAxxlpk8FvtZCB1kngytjugrGDZAtd0bMriS34ZAoEmaa1r',
    'PHONE_NUMBER_ID':      '996489716881422',
    'VERIFY_TOKEN':         'chatpdf_verify_2024',
    'SHEET_ID':             '1WATRBjmdo6D60R1uSc7F74HY7AjRXlFdKJZUoJR60Sc',
    'KEYWORD_PDF_CATALOGO': '1K4H-MDsJYiKyjUPXZt5PPgsjAM05Btj7',
    'KEYWORD_PDF_PRECIOS':  '1KWtu2x06HesYmFl0HSPLgIrFM7kIuS4M'
  });

  Logger.log('Configuración guardada correctamente en Script Properties.');
}
