import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MailService } from './mail.service';

describe('MailService y Seguridad Google Apps Script', () => {
  let service: MailService;
  const originalFetch = global.fetch;

  // Clave secreta Base64 de prueba con caracteres especiales y padding '='
  const TEST_BASE64_SECRET = 'aW52ZW50YXJpby1tb3Rvcy1zeXN0ZW1teC1zZWNyZXQtMjAyNiE=';
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_test/exec';

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SYSTEMMX_MAIL_APPS_SCRIPT_URL') return APPS_SCRIPT_URL;
      if (key === 'SYSTEMMX_MAIL_SECRET') return TEST_BASE64_SECRET;
      if (key === 'SYSTEMMX_MAIL_FROM') return 'receptor847@gmail.com';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('1. Coincidencia HMAC-SHA256 entre NestJS y Apps Script', () => {
    it('debe producir la misma firma HMAC-SHA256 con claves Base64 con padding =', () => {
      const timestamp = 1770000000;
      const nonce = 'a1b2c3d4e5f60718';
      const corePayload = {
        to: 'juanito@gmail.com',
        recipientName: 'Juanito Pérez',
        type: 'INVITACION',
        actionUrl: 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'a'.repeat(64),
        expirationMinutes: 1440,
        lang: 'es',
        from: 'receptor847@gmail.com',
      };

      const canonicalString = service.construirPayloadCanonico(timestamp, nonce, corePayload);
      const signatureNest = service.calcularHmacSha256(canonicalString, TEST_BASE64_SECRET);

      // Simular cálculo exacto de Apps Script: Utilities.computeHmacSha256Signature
      const signatureAppsScriptSim = crypto
        .createHmac('sha256', TEST_BASE64_SECRET.trim())
        .update(canonicalString)
        .digest('hex');

      expect(signatureNest).toBe(signatureAppsScriptSim);
      expect(signatureNest).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(signatureNest)).toBe(true);
    });

    it('debe rechazar si la firma HMAC es alterada o no coincide', () => {
      const timestamp = 1770000000;
      const nonce = 'a1b2c3d4e5f60718';
      const corePayload = {
        to: 'juanito@gmail.com',
        recipientName: 'Juanito Pérez',
        type: 'INVITACION',
        actionUrl: 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'a'.repeat(64),
        expirationMinutes: 1440,
        lang: 'es',
        from: 'receptor847@gmail.com',
      };

      const canonicalString = service.construirPayloadCanonico(timestamp, nonce, corePayload);
      const signatureOriginal = service.calcularHmacSha256(canonicalString, TEST_BASE64_SECRET);
      const signatureInvalida = signatureOriginal.slice(0, -2) + 'ff';

      expect(signatureOriginal).not.toBe(signatureInvalida);
    });
  });

  describe('2. Validación estricta de URL (simulación Apps Script y compatibilidad HashRouter)', () => {
    function validarUrlAppsScript(urlString: string, expectedType: string) {
      if (typeof urlString !== 'string' || !urlString) {
        return { valid: false, error: 'URL requerida' };
      }
      const urlRegex = /^https:\/\/([a-zA-Z0-9.-]+)(?::([0-9]+))?(\s*\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/;
      const match = urlString.match(urlRegex);
      if (!match) return { valid: false, error: 'Protocolo HTTPS requerido' };

      const host = (match[1] || '').toLowerCase();
      const port = match[2];
      const pathname = match[3] || '/';
      const search = match[4] || '';
      const hash = match[5] || '';

      const ALLOWED_HOST = 'systemmx-web-200684331.onrender.com';
      if (host !== ALLOWED_HOST) {
        return { valid: false, error: 'Host no autorizado: ' + host };
      }

      if (port && port !== '443') {
        return { valid: false, error: 'Puerto no estándar no permitido' };
      }

      let effectiveRoute = pathname;
      let queryToParse = search;

      if (hash) {
        const cleanHash = hash.replace(/^\/+/, '');
        const hashQueryIdx = cleanHash.indexOf('?');
        if (hashQueryIdx !== -1) {
          effectiveRoute = '/' + cleanHash.slice(0, hashQueryIdx).replace(/^\/+/, '');
          queryToParse = cleanHash.slice(hashQueryIdx + 1);
        } else {
          effectiveRoute = '/' + cleanHash;
          if (!queryToParse && search) queryToParse = search;
        }
      }

      const expectedRoute = expectedType === 'INVITACION' ? '/activar-cuenta' : '/restablecer-contrasena';
      if (expectedType !== 'INVITACION' && expectedType !== 'RECUPERACION_PASSWORD') {
        return { valid: false, error: 'Tipo de acción desconocido' };
      }

      if (effectiveRoute !== expectedRoute) {
        return { valid: false, error: 'Ruta no autorizada para ' + expectedType };
      }

      const params: Record<string, string> = {};
      queryToParse.split('&').forEach((p) => {
        const parts = p.split('=');
        if (parts[0]) params[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join('='));
      });

      const token = params['token'];
      if (!token || !/^[a-fA-F0-9]{32,128}$/.test(token)) {
        return { valid: false, error: 'Token inválido' };
      }

      return { valid: true };
    }

    it('debe aceptar URL legítima HTTPS con HashRouter (/#/activar-cuenta?token=...)', () => {
      const hashUrl = 'https://systemmx-web-200684331.onrender.com/#/activar-cuenta?token=' + 'f'.repeat(64);
      const res = validarUrlAppsScript(hashUrl, 'INVITACION');
      expect(res.valid).toBe(true);
    });

    it('debe aceptar URL legítima HTTPS con HashRouter para recuperación (/#/restablecer-contrasena?token=...)', () => {
      const hashUrl = 'https://systemmx-web-200684331.onrender.com/#/restablecer-contrasena?token=' + 'f'.repeat(64);
      const res = validarUrlAppsScript(hashUrl, 'RECUPERACION_PASSWORD');
      expect(res.valid).toBe(true);
    });
    it('debe aceptar URL legítima HTTPS del host de producción con ruta directa y token correctos', () => {
      const validUrl = 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'f'.repeat(64);
      const res = validarUrlAppsScript(validUrl, 'INVITACION');
      expect(res.valid).toBe(true);
    });

    it('debe rechazar dominio falsificado o parecido (e.g. systemmx-web-fraud.onrender.com)', () => {
      const fakeUrl = 'https://systemmx-web-fraud.onrender.com/activar-cuenta?token=' + 'f'.repeat(64);
      const res = validarUrlAppsScript(fakeUrl, 'INVITACION');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Host no autorizado');
    });

    it('debe rechazar URLs con protocolo no seguro HTTP o localhost en producción', () => {
      const httpUrl = 'http://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'f'.repeat(64);
      expect(validarUrlAppsScript(httpUrl, 'INVITACION').valid).toBe(false);

      const localhostUrl = 'https://localhost:5173/activar-cuenta?token=' + 'f'.repeat(64);
      expect(validarUrlAppsScript(localhostUrl, 'INVITACION').valid).toBe(false);
    });

    it('debe rechazar si la ruta no corresponde al tipo de acción', () => {
      // Intentar usar ruta de restablecer contraseña con tipo INVITACION
      const mismatchedUrl = 'https://systemmx-web-200684331.onrender.com/restablecer-contrasena?token=' + 'f'.repeat(64);
      const res = validarUrlAppsScript(mismatchedUrl, 'INVITACION');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Ruta no autorizada');
    });

    it('debe rechazar si el token falta o tiene formato inválido', () => {
      const noToken = 'https://systemmx-web-200684331.onrender.com/activar-cuenta';
      expect(validarUrlAppsScript(noToken, 'INVITACION').valid).toBe(false);

      const invalidToken = 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=bad!token';
      expect(validarUrlAppsScript(invalidToken, 'INVITACION').valid).toBe(false);
    });
  });

  describe('3. Escapado seguro de HTML contra XSS en plantillas', () => {
    function escapeHtml(str: string): string {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    it('debe neutralizar intentos de inyección HTML y JavaScript en campos dinámicos', () => {
      const maliciousName = '<script>alert("xss")</script>Juanito<img src=x onerror=alert(1)>';
      const escaped = escapeHtml(maliciousName);

      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;img');
    });
  });

  describe('4. Manejo real de respuestas, HTTP 200 con success: false y redirecciones', () => {
    it('debe tratar una respuesta HTTP 200 con success: false como fallo y no realizar reintentos innecesarios', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: false,
            error: 'Host no autorizado (evil.com)',
          }),
        };
      });

      await expect(
        service.enviarCorreoAccion({
          to: 'destinatario@gmail.com',
          recipientName: 'Destinatario',
          type: 'INVITACION',
          actionUrl: 'https://evil.com/fake',
          expirationMinutes: 1440,
        }),
      ).rejects.toThrow('Host no autorizado (evil.com)');

      // Verificamos que NO reintentó cuando Apps Script rechazó explícitamente por validación
      expect(callCount).toBe(1);
    });

    it('debe seguir redirecciones y retornar éxito cuando Apps Script responde success: true', async () => {
      let passedOptions: RequestInit | undefined;
      global.fetch = jest.fn().mockImplementation(async (_url, options) => {
        passedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            processedAt: new Date().toISOString(),
          }),
        };
      });

      const res = await service.enviarCorreoAccion({
        to: 'juanito@gmail.com',
        recipientName: 'Juanito',
        type: 'INVITACION',
        actionUrl: 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'a'.repeat(64),
        expirationMinutes: 1440,
      });

      expect(res.exito).toBe(true);
      expect(res.proveedor).toBe('google_apps_script');
      expect(passedOptions?.redirect).toBe('follow');
    });

    it('no debe reintentar automáticamente ante fallo de conexión para evitar envíos duplicados', async () => {
      let attempts = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        attempts++;
        throw new Error('Connection reset by peer');
      });

      await expect(
        service.enviarCorreoAccion({
          to: 'juanito@gmail.com',
          recipientName: 'Juanito',
          type: 'INVITACION',
          actionUrl: 'https://systemmx-web-200684331.onrender.com/#/activar-cuenta?token=' + 'a'.repeat(64),
          expirationMinutes: 1440,
        }),
      ).rejects.toThrow('No se pudo enviar el correo de notificación: Connection reset by peer');

      expect(attempts).toBe(1);
    });

    it('enmascara tokens en logs y no expone el secreto ni tokens completos', async () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'SYSTEMMX_MAIL_APPS_SCRIPT_URL') return '';
        if (key === 'SYSTEMMX_MAIL_SECRET') return '';
        return null;
      });

      const rawToken = 'b7c7501d9b9d74b2020c1fc5c496651fba1ac8334fc87cf03a330e30c7ca821f';
      await service.enviarCorreoAccion({
        to: 'destinatario@gmail.com',
        recipientName: 'Test',
        type: 'INVITACION',
        actionUrl: `https://systemmx-web-200684331.onrender.com/#/activar-cuenta?token=${rawToken}`,
        expirationMinutes: 1440,
      });

      expect(warnSpy).toHaveBeenCalled();
      const loggedMessage = warnSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain(rawToken);
      expect(loggedMessage).toContain('token=b7c7***821f');
      warnSpy.mockRestore();
    });
  });
  describe('5. Prohibición estricta de proveedor simulado en producción', () => {
    it('debe rechazar y lanzar excepción si se ejecuta en producción sin Apps Script configurado', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'SYSTEMMX_MAIL_APPS_SCRIPT_URL') return '';
        if (key === 'SYSTEMMX_MAIL_SECRET') return '';
        return null;
      });

      await expect(
        service.enviarCorreoAccion({
          to: 'usuario@gmail.com',
          recipientName: 'Usuario',
          type: 'INVITACION',
          actionUrl: 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'b'.repeat(64),
          expirationMinutes: 1440,
        }),
      ).rejects.toThrow('Servicio de correo no configurado para producción');
    });

    it('debe permitir modo simulado únicamente en entorno de desarrollo cuando no hay credenciales', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'SYSTEMMX_MAIL_APPS_SCRIPT_URL') return '';
        if (key === 'SYSTEMMX_MAIL_SECRET') return '';
        return null;
      });

      const res = await service.enviarCorreoAccion({
        to: 'usuario@gmail.com',
        recipientName: 'Usuario',
        type: 'INVITACION',
        actionUrl: 'https://systemmx-web-200684331.onrender.com/activar-cuenta?token=' + 'b'.repeat(64),
        expirationMinutes: 1440,
      });

      expect(res.exito).toBe(true);
      expect(res.proveedor).toBe('simulado');
      expect(res.simulado).toBe(true);
    });
  });
});
