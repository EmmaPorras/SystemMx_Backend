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

  it('debe simular la migración de preproducción con 4 usuarios (2 ADMIN y 2 OPERADOR) preservando credenciales y estados', async () => {
    const usuariosSimulados = [
      { idUsuario: 1, username: 'admin1', email: 'admin1@systemmx.com', contrasenaHash: '$2b$10$hash1', rol: 'ADMIN', estadoActivacion: 'ACTIVO', activo: true },
      { idUsuario: 2, username: 'admin2', email: 'admin2@systemmx.com', contrasenaHash: '$2b$10$hash2', rol: 'ADMIN', estadoActivacion: 'ACTIVO', activo: true },
      { idUsuario: 3, username: 'operador1', email: 'operador1@systemmx.com', contrasenaHash: '$2b$10$hash3', rol: 'OPERADOR', estadoActivacion: 'ACTIVO', activo: true },
      { idUsuario: 4, username: 'operador2', email: 'operador2@systemmx.com', contrasenaHash: '$2b$10$hash4', rol: 'OPERADOR', estadoActivacion: 'PENDIENTE_ACTIVACION', activo: true },
    ];

    mockQueryRunner = {
      connection: { options: { type: 'postgres' } },
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes(`UPDATE "usuario" SET "rol" = 'CONSULTA' WHERE "rol" = 'OPERADOR'`)) {
          usuariosSimulados.forEach((u) => {
            if (u.rol === 'OPERADOR') {
              u.rol = 'CONSULTA';
            }
          });
        }
        return Promise.resolve();
      }),
    };

    await migration.up(mockQueryRunner);

    expect(usuariosSimulados).toHaveLength(4);
    expect(usuariosSimulados.filter((u) => u.rol === 'ADMIN')).toHaveLength(2);
    expect(usuariosSimulados.filter((u) => u.rol === 'CONSULTA')).toHaveLength(2);
    expect(usuariosSimulados.some((u) => u.rol === 'OPERADOR')).toBe(false);
    expect(usuariosSimulados[0].contrasenaHash).toBe('$2b$10$hash1');
    expect(usuariosSimulados[3].estadoActivacion).toBe('PENDIENTE_ACTIVACION');
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
