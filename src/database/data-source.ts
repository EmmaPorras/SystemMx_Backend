import 'dotenv/config';

import { DataSource, type DataSourceOptions } from 'typeorm';
import { detectDatabaseType } from './column-types';

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
  const dbType = detectDatabaseType(env);

  // Soporte de PostgreSQL / Neon (Producción en Render o DB_TYPE=postgres)
  if (dbType === 'postgres') {
    const databaseUrl =
      optional(env, 'DATABASE_URL_UNPOOLED') ?? optional(env, 'DATABASE_URL');

    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: false,
        migrationsTableName: 'migrations',
        migrationsTransactionMode: 'all',
        logging: booleanValue(env, 'DB_LOGGING', false),
      };
    }

    const credentials = migrationCredentials(env);
    return {
      type: 'postgres',
      host: optional(env, 'DB_HOST') || 'localhost',
      port: env.DB_PORT ? portValue(env) : 5432,
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
    };
  }

  // Soporte de SQL Server (Desarrollo local por defecto o DB_TYPE=mssql)
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

const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const envForDefaultSource: NodeJS.ProcessEnv = isTestEnv
  ? {
      DB_HOST: 'localhost',
      DB_PORT: '1433',
      DB_USERNAME: process.env.DB_USERNAME || 'test_user',
      DB_PASSWORD: process.env.DB_PASSWORD || 'test_password',
      DB_DATABASE: process.env.DB_DATABASE || 'test_db',
      ...process.env,
    }
  : process.env;

const dataSource = new DataSource(
  createMigrationDataSourceOptions(envForDefaultSource),
);

export default dataSource;
