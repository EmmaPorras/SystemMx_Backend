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

export function createMigrationDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'mssql',

    host: required(env, 'DB_HOST'),

    port: portValue(env),

    username: required(env, 'DB_USERNAME'),

    password: required(env, 'DB_PASSWORD'),

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
