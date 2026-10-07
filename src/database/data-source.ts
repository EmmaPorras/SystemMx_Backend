import 'dotenv/config';

import { DataSource, type DataSourceOptions } from 'typeorm';

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} es obligatorio para el DataSource de migrations.`);
  }

  return value;
}

function optional(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value || undefined;
}

function booleanValue(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue = false,
): boolean {
  const raw = env[name]?.trim();

  if (!raw) return defaultValue;
  if (raw === 'true') return true;
  if (raw === 'false') return false;

  throw new Error(`${name} debe ser true o false.`);
}

export function createMigrationDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const url =
    optional(env, 'DATABASE_URL_UNPOOLED') ?? required(env, 'DATABASE_URL');

  return {
    type: 'postgres',
    url,

    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],

    synchronize: false,
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
    logging: booleanValue(env, 'DB_LOGGING', false),
  };
}

const dataSource = new DataSource(createMigrationDataSourceOptions());

export default dataSource;
