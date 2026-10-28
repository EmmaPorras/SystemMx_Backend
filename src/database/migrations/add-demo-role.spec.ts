import { AddDemoRole1788762600000 } from './1788762600000-AddDemoRole';

describe('AddDemoRole1788762600000 Migration (Fase 4 - Rol DEMO con Privilegios Mínimos)', () => {
  let migration: AddDemoRole1788762600000;
  let mockQueryRunner: any;
  let queriesPostgres: string[];
  let queriesMssql: string[];

  beforeEach(() => {
    migration = new AddDemoRole1788762600000();
    queriesPostgres = [];
    queriesMssql = [];
  });

  it('debe ejecutar la migración UP en PostgreSQL agregando DEMO al check constraint', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'postgres' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesPostgres.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.up(mockQueryRunner);

    expect(
      queriesPostgres.some(
        (q) =>
          q.includes('CK_usuario_rol_valido') &&
          q.includes('DEMO') &&
          q.includes('CONSULTA') &&
          q.includes('ADMIN'),
      ),
    ).toBe(true);
  });

  it('debe ejecutar la migración UP en SQL Server agregando DEMO al check constraint', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'mssql' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesMssql.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.up(mockQueryRunner);

    expect(
      queriesMssql.some(
        (q) =>
          q.includes('CK_usuario_rol_valido') &&
          q.includes('DEMO') &&
          q.includes('CONSULTA') &&
          q.includes('ADMIN'),
      ),
    ).toBe(true);
  });

  it('debe ejecutar la migración DOWN en PostgreSQL restaurando roles previos', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'postgres' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesPostgres.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryRunner);

    expect(queriesPostgres.some((q) => q.includes(`UPDATE "usuario" SET "rol" = 'CONSULTA' WHERE "rol" = 'DEMO'`))).toBe(true);
    expect(queriesPostgres.some((q) => q.includes('CK_usuario_rol_valido') && !q.includes('DEMO'))).toBe(true);
  });

  it('debe ejecutar la migración DOWN en SQL Server restaurando roles previos', async () => {
    mockQueryRunner = {
      connection: { options: { type: 'mssql' } },
      query: jest.fn().mockImplementation((sql: string) => {
        queriesMssql.push(sql);
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryRunner);

    expect(queriesMssql.some((q) => q.includes(`UPDATE [usuario] SET [rol] = 'CONSULTA' WHERE [rol] = 'DEMO'`))).toBe(true);
    expect(queriesMssql.some((q) => q.includes('CK_usuario_rol_valido') && !q.includes('DEMO'))).toBe(true);
  });
});

