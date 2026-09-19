import { ConfigService } from '@nestjs/config';

import { createRuntimeTypeOrmOptions } from './runtime-typeorm.options';

interface SqlServerRuntimeOptions {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: string[];
  synchronize: boolean;
  migrationsRun: boolean;
  dropSchema: boolean;
  logging: boolean;
  options?: {
    encrypt?: boolean;
    trustServerCertificate?: boolean;
  };
  extra?: {
    requestTimeout?: number;
    connectionTimeout?: number;
  };
}

describe('createRuntimeTypeOrmOptions', () => {
  const createMockConfig = (overrides: Record<string, string> = {}) => {
    const values: Record<string, string> = {
      DB_HOST: 'localhost',
      DB_PORT: '1433',
      DB_USERNAME: 'runtime_user',
      DB_PASSWORD: 'runtime_password',
      DB_DATABASE: 'systemmx_test',
      DB_LOGGING: 'false',
      DB_ENCRYPT: 'false',
      DB_TRUST_SERVER_CERTIFICATE: 'true',
      ...overrides,
    };

    return {
      get: jest.fn((key: string) => values[key]),
      getOrThrow: jest.fn((key: string) => {
        const value = values[key];
        if (value === undefined) {
          throw new Error(`Missing ${key}`);
        }
        return value;
      }),
    } as unknown as ConfigService;
  };

  it('debe tener synchronize, migrationsRun y dropSchema en false estrictamente', () => {
    const config = createMockConfig();
    const options = createRuntimeTypeOrmOptions(
      config,
    ) as unknown as SqlServerRuntimeOptions;

    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(false);
    expect(options.dropSchema).toBe(false);
  });

  it('debe mapear correctamente los valores de conexión requeridos', () => {
    const config = createMockConfig();
    const options = createRuntimeTypeOrmOptions(
      config,
    ) as unknown as SqlServerRuntimeOptions;

    expect(options.type).toBe('mssql');
    expect(options.host).toBe('localhost');
    expect(options.port).toBe(1433);
    expect(options.username).toBe('runtime_user');
    expect(options.password).toBe('runtime_password');
    expect(options.database).toBe('systemmx_test');
    expect(options.entities).toBeDefined();
    expect(Array.isArray(options.entities)).toBe(true);
  });

  it('debe configurar logging según DB_LOGGING', () => {
    const configFalse = createMockConfig({ DB_LOGGING: 'false' });
    const optionsFalse = createRuntimeTypeOrmOptions(
      configFalse,
    ) as unknown as SqlServerRuntimeOptions;
    expect(optionsFalse.logging).toBe(false);

    const configTrue = createMockConfig({ DB_LOGGING: 'true' });
    const optionsTrue = createRuntimeTypeOrmOptions(
      configTrue,
    ) as unknown as SqlServerRuntimeOptions;
    expect(optionsTrue.logging).toBe(true);
  });

  it('debe configurar opciones de TLS y certificados correctamente', () => {
    const config = createMockConfig({
      DB_ENCRYPT: 'true',
      DB_TRUST_SERVER_CERTIFICATE: 'false',
    });
    const options = createRuntimeTypeOrmOptions(
      config,
    ) as unknown as SqlServerRuntimeOptions;

    expect(options.options?.encrypt).toBe(true);
    expect(options.options?.trustServerCertificate).toBe(false);
    expect(options.extra?.requestTimeout).toBe(60000);
    expect(options.extra?.connectionTimeout).toBe(60000);
  });

  it('debe lanzar error si falta alguna variable obligatoria', () => {
    const config = {
      get: jest.fn(),
      getOrThrow: jest.fn((key: string) => {
        throw new Error(`Missing ${key}`);
      }),
    } as unknown as ConfigService;

    expect(() => createRuntimeTypeOrmOptions(config)).toThrow();
  });
});
