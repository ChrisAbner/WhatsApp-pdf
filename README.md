# WhatsApp Webhook System - Google Apps Script

Sistema de webhook para WhatsApp Cloud API que se ejecuta en Google Apps Script. Automatiza la gestión de contactos y el envío de archivos PDF cuando los usuarios solicitan documentos mediante frases específicas.

## Arquitectura

```
Code.gs                  → Punto de entrada (doGet, doPost)
Config.gs                → Configuración y mapeo de palabras clave
WhatsAppAPI.gs           → Integración con WhatsApp Cloud API
SheetsManager.gs         → CRUD de contactos en Google Sheets
DriveManager.gs          → Acceso a archivos de Google Drive
MessageProcessor.gs      → Detección de palabras clave y lógica
ValidationSecurity.gs    → Validaciones y seguridad del webhook
```

## Flujo de ejecución

1. WhatsApp Cloud API envía POST al webhook
2. `doPost()` recibe y valida el payload
3. Se extrae nombre y teléfono del contacto
4. Si el contacto no existe, se registra en Google Sheets
5. Se analiza el texto buscando palabras clave ("catálogo", "precios", etc.)
6. Si se detecta keyword y no se envió antes, se obtiene el PDF de Drive y se envía por WhatsApp
7. Se marca el envío en Sheets para evitar duplicados

## Configuración paso a paso

### 1. Crear aplicación en Meta for Developers

1. Ir a https://developers.facebook.com/
2. Crear nueva app → Tipo "Business"
3. Agregar producto "WhatsApp"
4. Obtener **Phone Number ID** y **Token permanente**:
   - Business Settings → System Users → Crear System User (Admin)
   - Generar token con permisos: `whatsapp_business_messaging`, `whatsapp_business_management`

### 2. Preparar Google Workspace

**Google Sheets:**
1. Crear nueva hoja de cálculo llamada "Contactos WhatsApp"
2. Copiar el **ID de la hoja** desde la URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
3. Los encabezados se crean automáticamente al primer uso

**Google Drive:**
1. Subir los archivos PDF que se enviarán
2. Para cada archivo, copiar el **ID** desde la URL: `https://drive.google.com/file/d/[FILE_ID]/view`
3. Los permisos de acceso se configuran automáticamente por el código

### 3. Crear proyecto en Google Apps Script

1. Ir a https://script.google.com/
2. Nuevo proyecto → Nombrar "WhatsApp Webhook System"
3. Crear los 7 archivos `.gs` copiando el contenido de este repositorio
4. Ejecutar la función `setupConfiguration()` una sola vez, **después de reemplazar los valores de ejemplo** en `Config.gs`:
   - `WHATSAPP_TOKEN`: Token permanente de Meta
   - `PHONE_NUMBER_ID`: Phone Number ID de Meta
   - `VERIFY_TOKEN`: String aleatorio seguro (inventar uno)
   - `SHEET_ID`: ID de la Google Sheet
   - `KEYWORD_PDF_CATALOGO`: ID del archivo catálogo en Drive
   - `KEYWORD_PDF_PRECIOS`: ID del archivo de precios en Drive

### 4. Desplegar como Web App

1. Click "Deploy" → "New deployment"
2. Tipo: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy → Copiar la URL generada

### 5. Configurar webhook en Meta

1. WhatsApp → Configuration → Webhook → Edit
2. **Callback URL**: La URL de la Web App
3. **Verify token**: El mismo `VERIFY_TOKEN` que configuraste
4. Click "Verify and Save"
5. Suscribirse al campo **messages**

## Agregar nuevas palabras clave

1. En `Config.gs`, agregar entradas al objeto `KEYWORD_MAPPINGS`:
   ```javascript
   var KEYWORD_MAPPINGS = {
     'catalogo':          'KEYWORD_PDF_CATALOGO',
     'nuevo documento':   'KEYWORD_PDF_NUEVO',  // ← Nueva entrada
   };
   ```

2. En `setupConfiguration()` (o directamente en Script Properties), agregar el ID del archivo:
   ```javascript
   'KEYWORD_PDF_NUEVO': 'ID_DEL_ARCHIVO_EN_DRIVE'
   ```

3. Redesplegar la Web App (Deploy → Manage deployments → Edit → New version)

## Verificación

**Test de webhook:**
```
GET https://[TU-WEB-APP-URL]?hub.mode=subscribe&hub.verify_token=[TU_TOKEN]&hub.challenge=TEST123
```
Resultado esperado: `TEST123`

**Test de mensaje:** Enviar un texto al número de WhatsApp Business y verificar:
- El contacto aparece en Google Sheets
- Se recibe respuesta en WhatsApp

**Test de keyword:** Enviar "catálogo" y verificar:
- Se recibe el PDF
- La columna "PDF Enviado" se actualiza en Sheets

## Límites de Google Apps Script

- Tiempo máximo de ejecución: 6 minutos por invocación
- UrlFetch: 20,000 llamadas/día
- Propiedades del script: 500 KB total

## Seguridad

- Los tokens se almacenan en `PropertiesService`, nunca en código
- Los payloads se validan antes de procesarse
- Los números de teléfono se sanitizan (solo dígitos)
- El texto del usuario se limita a 500 caracteres y se eliminan caracteres de control
