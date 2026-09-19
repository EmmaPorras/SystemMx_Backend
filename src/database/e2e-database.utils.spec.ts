import { assertSafeE2eDatabaseName } from './e2e-database.utils';

describe('assertSafeE2eDatabaseName', () => {
  it('permite nombres válidos con el patrón inventario_motos_*_e2e', () => {
    expect(assertSafeE2eDatabaseName('inventario_motos_systemmx_e2e')).toBe(
      'inventario_motos_systemmx_e2e',
    );
    expect(assertSafeE2eDatabaseName('inventario_motos_test_e2e')).toBe(
      'inventario_motos_test_e2e',
    );
    expect(assertSafeE2eDatabaseName('  inventario_motos_run_1_e2e  ')).toBe(
      'inventario_motos_run_1_e2e',
    );
  });

  it('rechaza bases de datos protegidas o del sistema', () => {
    expect(() => assertSafeE2eDatabaseName('master')).toThrow();
    expect(() => assertSafeE2eDatabaseName('model')).toThrow();
    expect(() => assertSafeE2eDatabaseName('msdb')).toThrow();
    expect(() => assertSafeE2eDatabaseName('tempdb')).toThrow();
    expect(() => assertSafeE2eDatabaseName('inventario_motos_dev')).toThrow();
  });

  it('rechaza nombres con inyección SQL o caracteres no permitidos', () => {
    expect(() =>
      assertSafeE2eDatabaseName('inventario_motos_e2e;DROP DATABASE foo;'),
    ).toThrow();
    expect(() =>
      assertSafeE2eDatabaseName('inventario_motos_test_e2e--'),
    ).toThrow();
    expect(() =>
      assertSafeE2eDatabaseName("inventario_motos_' OR 1=1_e2e"),
    ).toThrow();
  });

  it('rechaza cadenas vacías o sin el patrón requerido', () => {
    expect(() => assertSafeE2eDatabaseName('')).toThrow();
    expect(() => assertSafeE2eDatabaseName('   ')).toThrow();
    expect(() => assertSafeE2eDatabaseName('systemmx')).toThrow();
    expect(() => assertSafeE2eDatabaseName('inventario_motos_prod')).toThrow();
    expect(() => assertSafeE2eDatabaseName('inventario_motos_e2e')).toThrow();
  });
});
