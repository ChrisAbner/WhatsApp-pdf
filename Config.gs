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
    SHEET_ID:        props.getProperty('SHEET_ID')
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
    'WHATSAPP_TOKEN':       'TU_TOKEN_PERMANENTE_AQUI',
    'PHONE_NUMBER_ID':      'TU_PHONE_NUMBER_ID_AQUI',
    'VERIFY_TOKEN':         'TU_VERIFY_TOKEN_SECRETO_AQUI',
    'SHEET_ID':             'TU_GOOGLE_SHEET_ID_AQUI',
    'KEYWORD_PDF_CATALOGO': 'ID_DEL_ARCHIVO_CATALOGO_EN_DRIVE',
    'KEYWORD_PDF_PRECIOS':  'ID_DEL_ARCHIVO_PRECIOS_EN_DRIVE'
  });

  Logger.log('Configuración guardada correctamente en Script Properties.');
}
