import 'dotenv/config';

import * as sql from 'mssql';

import { assertSafeE2eDatabaseName } from '../database/e2e-database.utils';

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} es obligatorio.`);
  }

  return value;
}

function optional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function envBoolean(name: string, fallback = false): boolean {
  const value = optional(name);

  if (!value) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} debe ser true o false.`);
}

function resolveAdminCredentials() {
  const e2eUsername = optional('DB_E2E_ADMIN_USERNAME');
  const e2ePassword = optional('DB_E2E_ADMIN_PASSWORD');

  if (Boolean(e2eUsername) !== Boolean(e2ePassword)) {
    throw new Error(
      'DB_E2E_ADMIN_USERNAME y DB_E2E_ADMIN_PASSWORD deben configurarse juntos.',
    );
  }

  if (e2eUsername && e2ePassword) {
    return {
      username: e2eUsername,
      password: e2ePassword,
    };
  }

  const migrationUsername = optional('DB_MIGRATION_USERNAME');
  const migrationPassword = optional('DB_MIGRATION_PASSWORD');

  if (migrationUsername && migrationPassword) {
    return {
      username: migrationUsername,
      password: migrationPassword,
    };
  }

  return {
    username: required('DB_USERNAME'),
    password: required('DB_PASSWORD'),
  };
}

async function main(): Promise<void> {
  const database = assertSafeE2eDatabaseName(required('DB_E2E_DATABASE'));

  const credentials = resolveAdminCredentials();

  const pool = await sql.connect({
    server: required('DB_HOST'),

    port: Number(required('DB_PORT')),

    user: credentials.username,

    password: credentials.password,

    database: 'master',

    options: {
      encrypt: envBoolean('DB_ENCRYPT'),

      trustServerCertificate: envBoolean('DB_TRUST_SERVER_CERTIFICATE'),
    },

    requestTimeout: 60_000,

    connectionTimeout: 60_000,
  });

  try {
    const safeIdentifier = `[${database}]`;

    const literal = database.replace(/'/g, "''");

    await pool.request().batch(`
      IF DB_ID(N'${literal}')
         IS NOT NULL
      BEGIN
        ALTER DATABASE
          ${safeIdentifier}
        SET SINGLE_USER
        WITH ROLLBACK IMMEDIATE;

        DROP DATABASE
          ${safeIdentifier};
      END;

      CREATE DATABASE
        ${safeIdentifier};
    `);

    console.log(`BD E2E recreada: ${database}`);
  } finally {
    await pool.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);

  process.exit(1);
});
