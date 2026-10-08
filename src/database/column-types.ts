/**
 * ============================================================================
 * SYSTEMMX — RESOLUTOR UNIFICADO DE MOTOR Y TIPOS DE COLUMNAS (PostgreSQL / SQL Server)
 * ============================================================================
 * PostgreSQL (Neon / Render): 'boolean', 'timestamptz', 'varchar', 'CURRENT_TIMESTAMP'
 * SQL Server (Desarrollo local): 'bit', 'datetime2', 'varchar', 'GETDATE()'
 * ============================================================================
 */

export type SupportedDatabaseType = 'postgres' | 'mssql';

/**
 * Detecta de forma determinista y unificada el motor de base de datos a utilizar
 * según las variables de entorno disponibles (DB_TYPE, DATABASE_URL o configuración local).
 */
export function detectDatabaseType(
  env: NodeJS.ProcessEnv = process.env,
): SupportedDatabaseType {
  // 1. Si DB_TYPE está configurado explícitamente
  const explicitType = env.DB_TYPE?.trim().toLowerCase();
  if (explicitType === 'postgres' || explicitType === 'postgresql') {
    return 'postgres';
  }
  if (explicitType === 'mssql' || explicitType === 'sqlserver') {
    return 'mssql';
  }

  // 2. Si existe DATABASE_URL o DATABASE_URL_UNPOOLED (ej. Neon / Render)
  const databaseUrl =
    env.DATABASE_URL_UNPOOLED?.trim() || env.DATABASE_URL?.trim();
  if (databaseUrl) {
    if (
      databaseUrl.startsWith('postgres://') ||
      databaseUrl.startsWith('postgresql://')
    ) {
      return 'postgres';
    }
    if (
      databaseUrl.startsWith('mssql://') ||
      databaseUrl.startsWith('sqlserver://')
    ) {
      return 'mssql';
    }
    // Por defecto cualquier URL en Render/Neon corresponde a PostgreSQL
    return 'postgres';
  }

  // 3. Por defecto en desarrollo local (con DB_HOST, DB_PORT, etc. o sin variables) se usa SQL Server (mssql)
  return 'mssql';
}

export function isSqlServer(env: NodeJS.ProcessEnv = process.env): boolean {
  return detectDatabaseType(env) === 'mssql';
}

export function isPostgres(env: NodeJS.ProcessEnv = process.env): boolean {
  return detectDatabaseType(env) === 'postgres';
}

export function resolveColumnType<T extends string>(
  pgType: T,
  msType: T,
  env: NodeJS.ProcessEnv = process.env,
): T {
  return isSqlServer(env) ? msType : pgType;
}

export function resolveSqlExpr(
  pgExpr: string,
  msExpr: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return isSqlServer(env) ? msExpr : pgExpr;
}
