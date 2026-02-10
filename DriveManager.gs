/**
 * DriveManager.gs - Acceso y gestión de archivos en Google Drive.
 */

/**
 * Obtiene el ID de archivo en Drive a partir de una palabra clave.
 * Busca la propiedad correspondiente en Script Properties.
 *
 * @param {string} keyword - Palabra clave normalizada (ej: "catalogo").
 * @return {string|null} ID del archivo en Drive o null si no hay mapeo.
 */
function mapKeywordToFileId(keyword) {
  var propertyKey = KEYWORD_MAPPINGS[keyword];
  if (!propertyKey) {
    Logger.log('No hay mapeo para la keyword: ' + keyword);
    return null;
  }

  var fileId = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (!fileId) {
    Logger.log('Property "' + propertyKey + '" no tiene valor configurado.');
    return null;
  }

  return fileId;
}

/**
 * Obtiene una URL pública para descargar un archivo de Google Drive.
 * Verifica que el archivo exista y tenga permisos de acceso público.
 *
 * La WhatsApp Cloud API necesita una URL accesible públicamente para
 * enviar archivos multimedia. Se usa el formato de exportación directa
 * de Drive: https://drive.google.com/uc?export=download&id=FILE_ID
 *
 * @param {string} fileId - ID del archivo en Google Drive.
 * @return {Object} Objeto con { url, mimeType, fileName } o null si falla.
 */
function getFilePublicUrl(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);

    // Asegurar que el archivo sea accesible con enlace
    var access = file.getSharingAccess();
    if (access !== DriveApp.Access.ANYONE && access !== DriveApp.Access.ANYONE_WITH_LINK) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Logger.log('Permisos actualizados a "Anyone with link" para: ' + fileId);
    }

    var mimeType = file.getMimeType();
    var fileName = file.getName();
    var url = 'https://drive.google.com/uc?export=download&id=' + fileId;

    return {
      url: url,
      mimeType: mimeType,
      fileName: fileName
    };
  } catch (e) {
    Logger.log('Error al obtener archivo de Drive (' + fileId + '): ' + e.message);
    return null;
  }
}

/**
 * Determina el tipo de media de WhatsApp según el MIME type del archivo.
 *
 * @param {string} mimeType - MIME type del archivo (ej: "application/pdf").
 * @return {string} Tipo de media para la API de WhatsApp ("document", "image", "video").
 */
function getWhatsAppMediaType(mimeType) {
  if (!mimeType) {
    return 'document';
  }

  if (mimeType.indexOf('image/') === 0) {
    return 'image';
  }

  if (mimeType.indexOf('video/') === 0) {
    return 'video';
  }

  // PDFs y cualquier otro tipo se envían como documento
  return 'document';
}
