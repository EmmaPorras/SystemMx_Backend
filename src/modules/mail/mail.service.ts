import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EnviarCorreoAccionParams, EnviarCorreoResultado } from './mail.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getAppsScriptUrl(): string {
    return (
      this.configService.get<string>('SYSTEMMX_MAIL_APPS_SCRIPT_URL') || ''
    ).trim();
  }

  private getSecret(): string {
    return (this.configService.get<string>('SYSTEMMX_MAIL_SECRET') || '').trim();
  }

  private getSenderEmail(): string {
    return (
      this.configService.get<string>('SYSTEMMX_MAIL_FROM') || 'receptor847@gmail.com'
    ).trim();
  }

  calcularHmacSha256(canonicalString: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(canonicalString).digest('hex');
  }

  construirPayloadCanonico(
    timestamp: number,
    nonce: string,
    corePayload: {
      to: string;
      recipientName: string;
      type: string;
      actionUrl: string;
      expirationMinutes: number;
      lang: string;
      from: string;
    },
  ): string {
    return `${timestamp}.${nonce}.${JSON.stringify(corePayload)}`;
  }

  async enviarCorreoAccion(
    params: EnviarCorreoAccionParams,
  ): Promise<EnviarCorreoResultado> {
    const appsScriptUrl = this.getAppsScriptUrl();
    const secret = this.getSecret();

    const nodeEnv = (
      this.configService.get<string>('NODE_ENV') || 'development'
    ).trim().toLowerCase();
    const isProduction = nodeEnv === 'production';

    // En producción NUNCA se permite el proveedor simulado:
    // la URL de Apps Script y el secreto son estrictamente obligatorios.
    if (!appsScriptUrl || !secret) {
      if (isProduction) {
        this.logger.error(
          'Configuración de correo incompleta en producción: SYSTEMMX_MAIL_APPS_SCRIPT_URL y SYSTEMMX_MAIL_SECRET son obligatorios.',
        );
        throw new Error(
          'Servicio de correo no configurado para producción: SYSTEMMX_MAIL_APPS_SCRIPT_URL y SYSTEMMX_MAIL_SECRET requeridos.',
        );
      }

      this.logger.warn(
        `[SIMULACIÓN CORREO] Para: ${params.to} | Tipo: ${params.type} | Acción: ${params.actionUrl} (Apps Script URL o Secret no configurados)`,
      );
      return {
        exito: true,
        proveedor: 'simulado',
        simulado: true,
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');

    const corePayload = {
      to: params.to.trim().toLowerCase(),
      recipientName: params.recipientName.trim(),
      type: params.type,
      actionUrl: params.actionUrl.trim(),
      expirationMinutes: params.expirationMinutes,
      lang: params.lang || 'es',
      from: this.getSenderEmail(),
    };

    const canonicalString = this.construirPayloadCanonico(
      timestamp,
      nonce,
      corePayload,
    );
    const signature = this.calcularHmacSha256(canonicalString, secret);

    const bodyToSend = JSON.stringify({
      ...corePayload,
      timestamp,
      nonce,
      signature,
    });

    const maxIntentos = 2;
    let ultimoError: Error | null = null;

    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SystemMx-Timestamp': String(timestamp),
            'X-SystemMx-Nonce': nonce,
            'X-SystemMx-Signature': signature,
          },
          body: bodyToSend,
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const statusText = response.statusText || 'Error HTTP';
          throw new Error(
            `Google Apps Script respondió con status ${response.status}: ${statusText}`,
          );
        }

        const responseData = (await response.json()) as {
          success?: boolean;
          error?: string;
        };

        // Si Apps Script procesó y rechazó con success: false, NO es error de red transitorio;
        // no reintentamos para evitar duplicados y arrojamos el motivo de rechazo directamente.
        if (responseData.success !== true) {
          const motivo =
            responseData.error || 'Respuesta no exitosa de Apps Script';
          this.logger.error(
            `Google Apps Script rechazó el envío a ${params.to}: ${motivo}`,
          );
          throw new Error(motivo);
        }

        this.logger.log(
          `Correo de tipo ${params.type} enviado exitosamente vía Apps Script a ${params.to}`,
        );

        return {
          exito: true,
          proveedor: 'google_apps_script',
        };
      } catch (err: unknown) {
        ultimoError = err instanceof Error ? err : new Error(String(err));

        // Si el error provino de un rechazo explícito de la aplicación Apps Script, no reintentar
        const esRechazoValidacion =
          ultimoError.message.includes('Host no autorizado') ||
          ultimoError.message.includes('Firma digital') ||
          ultimoError.message.includes('Firma expirada') ||
          ultimoError.message.includes('Solicitud duplicada') ||
          ultimoError.message.includes('Ruta no autorizada') ||
          ultimoError.message.includes('URL de acción inválida') ||
          ultimoError.message.includes('Destinatario de correo inválido');

        if (esRechazoValidacion) {
          throw ultimoError;
        }

        this.logger.warn(
          `Intento ${intento}/${maxIntentos} falló por red/timeout al contactar Apps Script para ${params.to}: ${ultimoError.message}`,
        );

        if (intento < maxIntentos) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    this.logger.error(
      `Fallo definitivo al enviar correo de tipo ${params.type} a ${params.to}: ${ultimoError?.message}`,
    );

    throw new Error(
      `No se pudo enviar el correo de notificación: ${ultimoError?.message}`,
    );
  }
}
