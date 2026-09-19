import { ConfigService } from '@nestjs/config';

export function obtenerJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET')?.trim();

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres.');
  }

  return secret;
}

export function obtenerJwtExpiresSeconds(configService: ConfigService): number {
  const raw = configService.get<string>('JWT_EXPIRES_SECONDS') ?? '3600';

  const expiresIn = Number(raw);

  if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
    throw new Error('JWT_EXPIRES_SECONDS debe ser un entero positivo.');
  }

  return expiresIn;
}
