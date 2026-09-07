const NODE_ENVS = ['development', 'test', 'production'] as const;

function asString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return `${val}`;
  return fallback;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = asString(config.NODE_ENV, 'development').trim();

  if (!NODE_ENVS.includes(nodeEnv as (typeof NODE_ENVS)[number])) {
    throw new Error('NODE_ENV inválido.');
  }

  const port = Number(config.PORT ?? 3000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT debe ser un puerto válido.');
  }

  const jwtSecret = asString(config.JWT_SECRET).trim();

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres.');
  }

  const jwtExpires = Number(config.JWT_EXPIRES_SECONDS ?? 3600);

  if (!Number.isInteger(jwtExpires) || jwtExpires <= 0) {
    throw new Error('JWT_EXPIRES_SECONDS debe ser un entero positivo.');
  }

  const corsOrigins = asString(config.CORS_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS debe contener al menos un origen.');
  }

  const synchronize = asString(config.DB_SYNCHRONIZE, 'false')
    .trim()
    .toLowerCase();

  if (!['true', 'false'].includes(synchronize)) {
    throw new Error('DB_SYNCHRONIZE debe ser true o false.');
  }

  if (nodeEnv === 'production' && synchronize === 'true') {
    throw new Error('DB_SYNCHRONIZE no puede estar habilitado en producción.');
  }

  return config;
}
