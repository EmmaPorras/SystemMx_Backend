import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const baseValido = {
    NODE_ENV: 'development',
    PORT: 3000,
    JWT_SECRET: '12345678901234567890123456789012',
    JWT_EXPIRES_SECONDS: 3600,
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173',
  };

  it('debe aceptar configuración válida en development', () => {
    expect(() => validateEnvironment(baseValido)).not.toThrow();
  });

  it('debe aceptar configuración válida en test', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, NODE_ENV: 'test' }),
    ).not.toThrow();
  });

  it('debe aceptar configuración válida en production', () => {
    expect(() =>
      validateEnvironment({
        ...baseValido,
        NODE_ENV: 'production',
      }),
    ).not.toThrow();
  });

  it('debe rechazar NODE_ENV inválido', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, NODE_ENV: 'staging' }),
    ).toThrow('NODE_ENV inválido.');
  });

  it('debe aceptar PORT válido', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, PORT: 8080 }),
    ).not.toThrow();
  });

  it('debe rechazar PORT 0', () => {
    expect(() => validateEnvironment({ ...baseValido, PORT: 0 })).toThrow(
      'PORT debe ser un puerto válido.',
    );
  });

  it('debe rechazar PORT > 65535', () => {
    expect(() => validateEnvironment({ ...baseValido, PORT: 70000 })).toThrow(
      'PORT debe ser un puerto válido.',
    );
  });

  it('debe rechazar PORT no entero', () => {
    expect(() => validateEnvironment({ ...baseValido, PORT: 3000.5 })).toThrow(
      'PORT debe ser un puerto válido.',
    );
  });

  it('debe rechazar JWT_SECRET menor a 32 caracteres', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, JWT_SECRET: 'corto' }),
    ).toThrow('JWT_SECRET debe existir y tener al menos 32 caracteres.');
  });

  it('debe rechazar JWT_EXPIRES_SECONDS <= 0', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, JWT_EXPIRES_SECONDS: 0 }),
    ).toThrow('JWT_EXPIRES_SECONDS debe ser un entero positivo.');

    expect(() =>
      validateEnvironment({ ...baseValido, JWT_EXPIRES_SECONDS: -10 }),
    ).toThrow('JWT_EXPIRES_SECONDS debe ser un entero positivo.');
  });

  it('debe rechazar JWT_EXPIRES_SECONDS decimal', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, JWT_EXPIRES_SECONDS: 3600.5 }),
    ).toThrow('JWT_EXPIRES_SECONDS debe ser un entero positivo.');
  });

  it('debe rechazar CORS_ORIGINS vacío', () => {
    expect(() =>
      validateEnvironment({ ...baseValido, CORS_ORIGINS: '' }),
    ).toThrow('CORS_ORIGINS debe contener al menos un origen.');

    expect(() =>
      validateEnvironment({ ...baseValido, CORS_ORIGINS: '   ,   ' }),
    ).toThrow('CORS_ORIGINS debe contener al menos un origen.');
  });
});
