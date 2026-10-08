import { RolesVentasCompras1788762500000 } from './1788762500000-RolesVentasCompras';

describe('RolesVentasCompras1788762500000 Migration', () => {
  let migration: RolesVentasCompras1788762500000;
  let mockQueryRunner: any;
  let queriesPostgres: string[];
  let queriesMssql: string[];

  beforeEach(() => {
    migration = new RolesVentasCompras1788762500000();
    queriesPostgres = [];
    queriesMssql = [];
  });

  it('debe ejecutar la migración UP en PostgreSQL migrando OPERADOR a CONSULTA y actualizando check constraint', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'postgres' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesPostgres.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.up(mockQueryRunner);

    expect(queriesPostgres.some((q) => q.includes('CONSULTA') && q.includes('OPERADOR'))).toBe(true);
    expect(queriesPostgres.some((q) => q.includes('CK_usuario_rol_valido') && q.includes('VENTAS') && q.includes('COMPRAS'))).toBe(true);
  });

  it('debe ejecutar la migración UP en SQL Server migrando OPERADOR a CONSULTA y actualizando check constraint', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'mssql' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesMssql.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.up(mockQueryRunner);

    expect(queriesMssql.some((q) => q.includes('CONSULTA') && q.includes('OPERADOR'))).toBe(true);
    expect(queriesMssql.some((q) => q.includes('CK_usuario_rol_valido') && q.includes('VENTAS') && q.includes('COMPRAS'))).toBe(true);
  });

  it('debe ejecutar la migración DOWN en PostgreSQL', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'postgres' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesPostgres.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryRunner);

    expect(queriesPostgres.some((q) => q.includes('CONSULTA') && q.includes('VENTAS'))).toBe(true);
    expect(queriesPostgres.some((q) => q.includes('CK_usuario_rol_valido') && q.includes('OPERADOR'))).toBe(true);
  });

  it('debe ejecutar la migración DOWN en SQL Server', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'mssql' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesMssql.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryRunner);

    expect(queriesMssql.some((q) => q.includes('CONSULTA') && q.includes('VENTAS'))).toBe(true);
    expect(queriesMssql.some((q) => q.includes('CK_usuario_rol_valido') && q.includes('OPERADOR'))).toBe(true);
  });
});
