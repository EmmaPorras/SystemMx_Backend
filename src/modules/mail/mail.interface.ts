export type TipoCorreoAccion = 'INVITACION' | 'RECUPERACION_PASSWORD';

export interface EnviarCorreoAccionParams {
  to: string;
  recipientName: string;
  type: TipoCorreoAccion;
  actionUrl: string;
  expirationMinutes: number;
  lang?: 'es' | 'en' | 'pt';
}

export interface EnviarCorreoResultado {
  exito: boolean;
  proveedor: 'google_apps_script' | 'simulado';
  simulado?: boolean;
}
