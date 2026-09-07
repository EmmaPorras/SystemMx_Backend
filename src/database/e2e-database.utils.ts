export function assertSafeE2eDatabaseName(database: string): string {
  const normalized = database.trim();

  if (!/^inventario_motos_[a-z0-9_]+_e2e$/i.test(normalized)) {
    throw new Error('La BD E2E debe usar el patrón inventario_motos_*_e2e.');
  }

  const forbidden = new Set([
    'master',
    'model',
    'msdb',
    'tempdb',
    'inventario_motos_dev',
  ]);

  if (forbidden.has(normalized.toLowerCase())) {
    throw new Error(`Base protegida: ${normalized}`);
  }

  return normalized;
}
