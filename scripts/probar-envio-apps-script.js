/**
 * ============================================================================
 * SYSTEMMX — PRUEBA CONTROLADA DE ENVÍO VÍA GOOGLE APPS SCRIPT
 * ============================================================================
 * Esta prueba:
 * 1. NO crea usuarios en la base de datos.
 * 2. NO altera inventario, ventas ni datos comerciales.
 * 3. Valida de extremo a extremo la firma HMAC-SHA256, el host de producción,
 *    la ruta y el envío real a través de receptor847@gmail.com.
 *
 * Uso en PowerShell:
 *   $env:SYSTEMMX_MAIL_SECRET="tu_secreto_base64_aqui"
 *   node scripts/probar-envio-apps-script.js [INVITACION|RECUPERACION_PASSWORD] [correo_destino]
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cargar variables de entorno desde .env si existe
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

const APPS_SCRIPT_URL =
  process.env.SYSTEMMX_MAIL_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzhgblogxuMY6fx8toDEl_ni1YeoalG60HDXpfD_HMCzXNUW10oqz__kb4PYtCZ9ftc1w/exec';

const SECRET = (process.env.SYSTEMMX_MAIL_SECRET || '').trim();
const FROM_EMAIL = (process.env.SYSTEMMX_MAIL_FROM || 'receptor847@gmail.com').trim();
const FRONTEND_URL = (
  process.env.SYSTEMMX_FRONTEND_URL || 'https://systemmx-web-200684331.onrender.com'
).replace(/\/+$/, '');

const tipo = (process.argv[2] || 'INVITACION').toUpperCase();
const destinatario = (process.argv[3] || 'receptor847@gmail.com').toLowerCase().trim();

if (!SECRET) {
  console.error('\n❌ ERROR: SYSTEMMX_MAIL_SECRET no está configurado.');
  console.error('Para ejecutar esta prueba segura, define la clave en .env o ejecuta en PowerShell:');
  console.error('  $env:SYSTEMMX_MAIL_SECRET="tu_clave_base64"');
  console.error('  node scripts/probar-envio-apps-script.js\n');
  process.exit(1);
}

if (tipo !== 'INVITACION' && tipo !== 'RECUPERACION_PASSWORD') {
  console.error('\n❌ Tipo no válido. Usa: INVITACION o RECUPERACION_PASSWORD\n');
  process.exit(1);
}

async function ejecutarPrueba() {
  console.log('\n======================================================');
  console.log('   SYSTEMMX — PRUEBA CONTROLADA DE CORREO TRANSACCIONAL');
  console.log('======================================================');
  console.log('Apps Script URL :', APPS_SCRIPT_URL);
  console.log('Remitente       :', FROM_EMAIL);
  console.log('Destinatario    :', destinatario);
  console.log('Tipo de correo  :', tipo);
  console.log('Secret (longitud):', SECRET.length, 'caracteres (oculto por seguridad)');

  // Generar token dummy de prueba (64 caracteres hex)
  const dummyToken = crypto.randomBytes(32).toString('hex');
  const pathPart = tipo === 'INVITACION' ? '/#/activar-cuenta' : '/#/restablecer-contrasena';
  const actionUrl = `${FRONTEND_URL}${pathPart}?token=${dummyToken}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const corePayload = {
    to: destinatario,
    recipientName: 'Administrador de Pruebas',
    type: tipo,
    actionUrl: actionUrl,
    expirationMinutes: tipo === 'INVITACION' ? 1440 : 30,
    lang: 'es',
    from: FROM_EMAIL,
  };

  const canonicalString = `${timestamp}.${nonce}.${JSON.stringify(corePayload)}`;
  const signature = crypto.createHmac('sha256', SECRET).update(canonicalString).digest('hex');

  const payloadToSend = {
    ...corePayload,
    timestamp,
    nonce,
    signature,
  };

  console.log('\n-> Enviando solicitud firmada a Google Apps Script...');
  console.log('   URL de acción validada:', actionUrl);

  try {
    const startTime = Date.now();
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SystemMx-Timestamp': String(timestamp),
        'X-SystemMx-Nonce': nonce,
        'X-SystemMx-Signature': signature,
      },
      body: JSON.stringify(payloadToSend),
      redirect: 'follow',
    });

    const elapsed = Date.now() - startTime;
    console.log(`<- Código de respuesta HTTP: ${response.status} (${elapsed} ms)`);

    const result = await response.json();
    console.log('<- Cuerpo recibido de Apps Script:', JSON.stringify(result, null, 2));

    if (result && result.success === true) {
      console.log('\n✅ PRUEBA EXITOSA:');
      console.log('   1. Firma digital HMAC-SHA256 verificada por Apps Script.');
      console.log('   2. Timestamp y nonce antirrepetición aprobados.');
      console.log('   3. URL de Render (host, protocolo HTTPS y token) validada estrictamente.');
      console.log(`   4. Correo enviado a través de ${FROM_EMAIL} hacia ${destinatario}.`);
      console.log('   5. La base de datos no fue tocada en lo absoluto.\n');
    } else {
      console.error('\n❌ ERROR DEVUELTO POR APPS SCRIPT:');
      console.error('   Motivo:', result ? result.error : 'Respuesta desconocida');
      console.error('   Revisa si el secreto en Apps Script coincide con SYSTEMMX_MAIL_SECRET.\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Error de red o comunicación con Google Apps Script:', err.message);
    process.exit(1);
  }
}

ejecutarPrueba();
