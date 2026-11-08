import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  EnviarCorreoAccionParams,
  EnviarCorreoResultado,
} from './mail.interface';

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
    return (
      this.configService.get<string>('SYSTEMMX_MAIL_SECRET') || ''
    ).trim();
  }

  private getSenderEmail(): string {
    return (
      this.configService.get<string>('SYSTEMMX_MAIL_FROM') ||
      'receptor847@gmail.com'
    ).trim();
  }

  calcularHmacSha256(canonicalString: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(canonicalString)
      .digest('hex');
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

  /**
   * Enmascara tokens sensibles dentro de URLs de acción para auditoría y logs seguros.
   */
  private enmascararUrl(url: string): string {
    if (!url) return '';
    return url.replace(
      /token=([a-fA-F0-9]{4})[a-fA-F0-9]+([a-fA-F0-9]{4})/g,
      'token=$1***$2',
    );
  }

  async enviarCorreoAccion(
    params: EnviarCorreoAccionParams,
  ): Promise<EnviarCorreoResultado> {
    const appsScriptUrl = this.getAppsScriptUrl();
    const secret = this.getSecret();

    const nodeEnv = (
      this.configService.get<string>('NODE_ENV') || 'development'
    )
      .trim()
      .toLowerCase();
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

      const urlEnmascarada = this.enmascararUrl(params.actionUrl);
      this.logger.warn(
        `[SIMULACIÓN CORREO] Para: ${params.to} | Tipo: ${params.type} | Acción: ${urlEnmascarada} (Apps Script URL o Secret no configurados)`,
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

    // Envío único (single-shot) sin reintentos automáticos para prevenir
    // duplicación de mensajes si Apps Script ya ejecutó MailApp.sendEmail().
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      const errorFinal = err instanceof Error ? err : new Error(String(err));
      this.logger.error(
        `Fallo al enviar correo de tipo ${params.type} a ${params.to}: ${errorFinal.message}`,
      );
      throw new Error(
        `No se pudo enviar el correo de notificación: ${errorFinal.message}`,
      );
    }
  }
}
