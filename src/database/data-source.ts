import 'dotenv/config';

import { DataSource, type DataSourceOptions } from 'typeorm';

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} es obligatorio para el DataSource de migrations.`);
  }

  return value;
}

function booleanValue(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue = false,
): boolean {
  const raw = env[name]?.trim();

  if (!raw) {
    return defaultValue;
  }

  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  throw new Error(`${name} debe ser true o false.`);
}

function portValue(env: NodeJS.ProcessEnv): number {
  const raw = required(env, 'DB_PORT');

  const port = Number(raw);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('DB_PORT debe ser un puerto válido.');
  }

  return port;
}

function optional(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();

  return value || undefined;
}

function migrationCredentials(env: NodeJS.ProcessEnv): {
  username: string;
  password: string;
} {
  const migrationUsername = optional(env, 'DB_MIGRATION_USERNAME');
  const migrationPassword = optional(env, 'DB_MIGRATION_PASSWORD');

  if (Boolean(migrationUsername) !== Boolean(migrationPassword)) {
    throw new Error(
      'DB_MIGRATION_USERNAME y DB_MIGRATION_PASSWORD deben configurarse juntos.',
    );
  }

  if (migrationUsername && migrationPassword) {
    return {
      username: migrationUsername,
      password: migrationPassword,
    };
  }

  return {
    username: required(env, 'DB_USERNAME'),
    password: required(env, 'DB_PASSWORD'),
  };
}

export function createMigrationDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const credentials = migrationCredentials(env);

  return {
    type: 'mssql',

    host: required(env, 'DB_HOST'),

    port: portValue(env),

    username: credentials.username,

    password: credentials.password,

    database: required(env, 'DB_DATABASE'),

    entities: [__dirname + '/entities/*.entity{.ts,.js}'],

    migrations: [__dirname + '/migrations/*{.ts,.js}'],

    synchronize: false,

    migrationsRun: false,

    migrationsTableName: 'migrations',

    migrationsTransactionMode: 'all',

    logging: booleanValue(env, 'DB_LOGGING', false),

    options: {
      encrypt: booleanValue(env, 'DB_ENCRYPT', false),

      trustServerCertificate: booleanValue(
        env,
        'DB_TRUST_SERVER_CERTIFICATE',
        false,
      ),
    },

    extra: {
      requestTimeout: 60_000,

      connectionTimeout: 60_000,
    },
  };
}

const dataSource = new DataSource(createMigrationDataSourceOptions());

export default dataSource;
