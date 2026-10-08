/**
 * ============================================================================
 * SYSTEMMX — RESOLUTOR DE TIPOS DE COLUMNAS MULTIMOTOR (PostgreSQL / SQL Server)
 * ============================================================================
 * PostgreSQL (Neon / Render): 'boolean', 'timestamptz', 'varchar', 'CURRENT_TIMESTAMP'
 * SQL Server (Desarrollo local): 'bit', 'datetime2', 'varchar', 'GETDATE()'
 * ============================================================================
 */

export function isSqlServer(): boolean {
  return process.env.DB_TYPE === 'mssql';
}

export function resolveColumnType<T extends string>(pgType: T, msType: T): T {
  return isSqlServer() ? msType : pgType;
}

export function resolveSqlExpr(pgExpr: string, msExpr: string): string {
  return isSqlServer() ? msExpr : pgExpr;
}
