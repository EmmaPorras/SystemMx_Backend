import { createMigrationDataSourceOptions } from './data-source';

describe('ETAPA 10B — DataSource de Migrations', () => {
  const validEnv: NodeJS.ProcessEnv = {
    DB_HOST: 'localhost',
    DB_PORT: '1433',
    DB_USERNAME: 'test_user',
    DB_PASSWORD: 'test_password',
    DB_DATABASE: 'test_database',
    DB_LOGGING: 'false',
    DB_ENCRYPT: 'false',
    DB_TRUST_SERVER_CERTIFICATE: 'true',
  };

  it('mantiene synchronize desactivado (false) estrictamente', () => {
    const options = createMigrationDataSourceOptions(validEnv);
    expect(options.synchronize).toBe(false);
  });

  it('mantiene migrationsRun desactivado (false) por defecto', () => {
    const options = createMigrationDataSourceOptions(validEnv);
    expect(options.migrationsRun).toBe(false);
  });

  it('configura migrationsTableName como migrations', () => {
    const options = createMigrationDataSourceOptions(validEnv);
    expect(options.migrationsTableName).toBe('migrations');
  });

  it('configura migrationsTransactionMode en all', () => {
    const options = createMigrationDataSourceOptions(validEnv);
    expect(options.migrationsTransactionMode).toBe('all');
  });

  it('configura type como mssql y carga base de datos correcta', () => {
    const options = createMigrationDataSourceOptions(validEnv);
    expect(options.type).toBe('mssql');
    expect(options.database).toBe('test_database');
  });

  it('procesa correctamente puerto válido', () => {
    const options = createMigrationDataSourceOptions({
      ...validEnv,
      DB_PORT: '1433',
    });
    expect(options.port).toBe(1433);
  });

  it('lanza error si DB_PORT no es numérico', () => {
    expect(() =>
      createMigrationDataSourceOptions({
        ...validEnv,
        DB_PORT: 'abc',
      }),
    ).toThrow('DB_PORT debe ser un puerto válido.');
  });

  it('lanza error si DB_PORT es 0 o negativo', () => {
    expect(() =>
      createMigrationDataSourceOptions({
        ...validEnv,
        DB_PORT: '0',
      }),
    ).toThrow('DB_PORT debe ser un puerto válido.');

    expect(() =>
      createMigrationDataSourceOptions({
        ...validEnv,
        DB_PORT: '-1433',
      }),
    ).toThrow('DB_PORT debe ser un puerto válido.');
  });

  it('lanza error si DB_PORT es mayor a 65535', () => {
    expect(() =>
      createMigrationDataSourceOptions({
        ...validEnv,
        DB_PORT: '65536',
      }),
    ).toThrow('DB_PORT debe ser un puerto válido.');
  });

  it('lanza error si falta DB_HOST', () => {
    const env = { ...validEnv };
    delete env.DB_HOST;
    expect(() => createMigrationDataSourceOptions(env)).toThrow(
      'DB_HOST es obligatorio para el DataSource de migrations.',
    );
  });

  it('lanza error si falta DB_USERNAME', () => {
    const env = { ...validEnv };
    delete env.DB_USERNAME;
    expect(() => createMigrationDataSourceOptions(env)).toThrow(
      'DB_USERNAME es obligatorio para el DataSource de migrations.',
    );
  });

  it('lanza error si falta DB_PASSWORD', () => {
    const env = { ...validEnv };
    delete env.DB_PASSWORD;
    expect(() => createMigrationDataSourceOptions(env)).toThrow(
      'DB_PASSWORD es obligatorio para el DataSource de migrations.',
    );
  });

  it('lanza error si falta DB_DATABASE', () => {
    const env = { ...validEnv };
    delete env.DB_DATABASE;
    expect(() => createMigrationDataSourceOptions(env)).toThrow(
      'DB_DATABASE es obligatorio para el DataSource de migrations.',
    );
  });

  it('procesa valores booleanos true y false correctamente', () => {
    const optTrue = createMigrationDataSourceOptions({
      ...validEnv,
      DB_LOGGING: 'true',
      DB_ENCRYPT: 'true',
    });
    expect(optTrue.logging).toBe(true);
    if (optTrue.type === 'mssql') {
      expect(optTrue.options?.encrypt).toBe(true);
    }

    const optFalse = createMigrationDataSourceOptions({
      ...validEnv,
      DB_LOGGING: 'false',
      DB_ENCRYPT: 'false',
    });
    expect(optFalse.logging).toBe(false);
    if (optFalse.type === 'mssql') {
      expect(optFalse.options?.encrypt).toBe(false);
    }
  });

  it('utiliza valor por defecto cuando variable booleana no está definida', () => {
    const env = { ...validEnv };
    delete env.DB_LOGGING;
    const options = createMigrationDataSourceOptions(env);
    expect(options.logging).toBe(false);
  });

  it('lanza error si variable booleana contiene texto no válido (ej: yes, 1, on)', () => {
    expect(() =>
      createMigrationDataSourceOptions({
        ...validEnv,
        DB_ENCRYPT: 'yes',
      }),
    ).toThrow('DB_ENCRYPT debe ser true o false.');

    expect(() =>
      createMigrationDataSourceOptions({
        ...validEnv,
        DB_LOGGING: '1',
      }),
    ).toThrow('DB_LOGGING debe ser true o false.');
  });

  describe('Credenciales de migraciones separadas', () => {
    it('utiliza DB_USERNAME y DB_PASSWORD como fallback cuando no se definen credenciales específicas', () => {
      const options = createMigrationDataSourceOptions(validEnv);
      expect(options.username).toBe('test_user');
      expect(options.password).toBe('test_password');
    });

    it('utiliza DB_MIGRATION_USERNAME y DB_MIGRATION_PASSWORD cuando ambos están configurados', () => {
      const options = createMigrationDataSourceOptions({
        ...validEnv,
        DB_MIGRATION_USERNAME: 'migrator_admin',
        DB_MIGRATION_PASSWORD: 'migrator_secret_password',
      });
      expect(options.username).toBe('migrator_admin');
      expect(options.password).toBe('migrator_secret_password');
    });

    it('lanza error si solo se define DB_MIGRATION_USERNAME', () => {
      expect(() =>
        createMigrationDataSourceOptions({
          ...validEnv,
          DB_MIGRATION_USERNAME: 'migrator_admin',
        }),
      ).toThrow(
        'DB_MIGRATION_USERNAME y DB_MIGRATION_PASSWORD deben configurarse juntos.',
      );
    });

    it('lanza error si solo se define DB_MIGRATION_PASSWORD', () => {
      expect(() =>
        createMigrationDataSourceOptions({
          ...validEnv,
          DB_MIGRATION_PASSWORD: 'migrator_secret_password',
        }),
      ).toThrow(
        'DB_MIGRATION_USERNAME y DB_MIGRATION_PASSWORD deben configurarse juntos.',
      );
    });
  });
});
