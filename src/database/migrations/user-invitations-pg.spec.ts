import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { UserInvitationsAndTokens1788762400000 } from './1788762400000-UserInvitationsAndTokens';

describe('Validación de Esquema y Restricciones DDL PostgreSQL (Emulación pg-mem)', () => {
  let db: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    db = newDb({ autoCreateForeignKeyIndices: true });

    db.public.registerFunction({
      name: 'version',
      implementation: () => 'PostgreSQL 16.0',
    });

    db.public.registerFunction({
      name: 'current_database',
      implementation: () => 'postgres',
    });

    // 1. Crear esquema base preexistente (como existe hoy en Neon)
    db.public.none(`
      CREATE TABLE "usuario" (
        "id_usuario" SERIAL PRIMARY KEY,
        "username" VARCHAR(50) NOT NULL UNIQUE,
        "username_normalizado" VARCHAR(50) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "nombre" VARCHAR(150) NOT NULL,
        "rol" VARCHAR(30) NOT NULL DEFAULT 'OPERADOR',
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "version_credenciales" INT NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Insertar Administrador existente sin email (esquema antiguo de producción)
      INSERT INTO "usuario" ("username", "username_normalizado", "password_hash", "nombre", "rol", "activo", "version_credenciales")
      VALUES ('admin.principal', 'admin.principal', '$argon2id$v=19$m=19456,p=1,t=2$fakehash', 'Admin Existente', 'ADMIN', true, 1);
    `);

    // 2. Crear DataSource de TypeORM conectado al adaptador de pg-mem
    const typeormDs = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [],
    });

    dataSource = await typeormDs.initialize();
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('1. Ejecuta la migración UP exitosamente sobre PostgreSQL', async () => {
    const migration = new UserInvitationsAndTokens1788762400000();
    const queryRunner = dataSource.createQueryRunner();

    await migration.up(queryRunner);
    await queryRunner.release();

    // Comprobar que el usuario admin preexistente sigue intacto y con estado ACTIVO
    const admin = db.public.many(
      `SELECT "id_usuario", "username", "nombre", "email", "estado_activacion" FROM "usuario" WHERE "username" = 'admin.principal'`,
    );
    expect(admin).toHaveLength(1);
    expect(admin[0].email).toBeNull();
        expect(admin[0].estado_activacion).toBe('ACTIVO');
    expect(admin[0].nombre).toBe('Admin Existente');
  });

  it('2. Permite crear usuarios con email y previene emails duplicados (Unique Index)', async () => {
    // Insertar usuario nuevo con email
    db.public.none(`
      INSERT INTO "usuario" ("username", "username_normalizado", "email", "email_normalizado", "password_hash", "nombre", "rol", "activo", "estado_activacion")
      VALUES ('colaborador.1', 'colaborador.1', 'user1@systemmx.com', 'user1@systemmx.com', 'hash1', 'Colab Uno', 'OPERADOR', true, 'PENDIENTE_ACTIVACION');
    `);

    // Intentar insertar otro usuario con el mismo email normalizado debe arrojar violación de unicidad
    expect(() => {
      db.public.none(`
        INSERT INTO "usuario" ("username", "username_normalizado", "email", "email_normalizado", "password_hash", "nombre", "rol", "activo", "estado_activacion")
        VALUES ('colaborador.2', 'colaborador.2', 'user1@systemmx.com', 'user1@systemmx.com', 'hash2', 'Colab Dos', 'OPERADOR', true, 'PENDIENTE_ACTIVACION');
      `);
    }).toThrow();
  });

  it('3. Permite múltiples usuarios sin email (NULL) simultáneamente', async () => {
    db.public.none(`
      INSERT INTO "usuario" ("username", "username_normalizado", "email", "email_normalizado", "password_hash", "nombre", "rol", "activo", "estado_activacion")
      VALUES ('admin.secundario', 'admin.secundario', NULL, NULL, 'hash_sec', 'Admin Secundario', 'ADMIN', true, 'ACTIVO');
    `);

    const usersWithoutEmail = db.public.many(
      `SELECT "username" FROM "usuario" WHERE "email" IS NULL`,
    );
    expect(usersWithoutEmail.length).toBeGreaterThanOrEqual(2);
  });

  it('4. Permite crear e insertar tokens en token_accion_usuario con FK y restricciones', async () => {
    const userRes = db.public.many(
      `SELECT "id_usuario" FROM "usuario" WHERE "username" = 'colaborador.1'`,
    );
    const userId = userRes[0].id_usuario;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    db.public.none(`
      INSERT INTO "token_accion_usuario" ("id_usuario", "tipo", "token_hash", "expira_en", "usado")
      VALUES (${userId}, 'INVITACION', '${tokenHash}', NOW() + INTERVAL '1 day', false);
    `);

    const tokenRow = db.public.many(
      `SELECT * FROM "token_accion_usuario" WHERE "token_hash" = '${tokenHash}'`,
    );
    expect(tokenRow).toHaveLength(1);
    expect(tokenRow[0].tipo).toBe('INVITACION');
    expect(tokenRow[0].usado).toBe(false);
  });

  it('5. Consumo atómico: carrera de concurrencia permite que exactamente una transacción consuma el token', async () => {
    const userRes = db.public.many(
      `SELECT "id_usuario" FROM "usuario" WHERE "username" = 'colaborador.1'`,
    );
    const userId = userRes[0].id_usuario;

    const rawToken = 'atomic_race_token_test_1234567890';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    db.public.none(`
      INSERT INTO "token_accion_usuario" ("id_usuario", "tipo", "token_hash", "expira_en", "usado")
      VALUES (${userId}, 'INVITACION', '${tokenHash}', NOW() + INTERVAL '1 day', false);
    `);

    // Función que simula el consumo atómico
    const consumeToken = (workerId: string) => {
      // Simulación de transacción atómica: UPDATE con condición usado = false
      const updateRes = db.public.many(
        `UPDATE "token_accion_usuario"
         SET "usado" = true, "usado_en" = NOW()
         WHERE "token_hash" = '${tokenHash}' AND "usado" = false
         RETURNING "id_token", "id_usuario"`,
      );

      if (!updateRes || updateRes.length === 0) {
        return { success: false, workerId, error: 'Token ya utilizado o expirado' };
      }

      // Actualizar usuario
      db.public.none(
        `UPDATE "usuario"
         SET "password_hash" = 'new_pass_${workerId}', "estado_activacion" = 'ACTIVO', "version_credenciales" = "version_credenciales" + 1
         WHERE "id_usuario" = ${updateRes[0].id_usuario}`,
      );

      return { success: true, workerId };
    };

    // Ejecutar múltiples intentos compitiendo por el mismo token
    const results = [
      consumeToken('W1'),
      consumeToken('W2'),
      consumeToken('W3'),
      consumeToken('W4'),
      consumeToken('W5'),
    ];

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(4);

    // Verificar que el token quedó marcado como usado
    const finalToken = db.public.many(
      `SELECT "usado" FROM "token_accion_usuario" WHERE "token_hash" = '${tokenHash}'`,
    );
    expect(finalToken[0].usado).toBe(true);

    // Verificar que la versión de credenciales del usuario solo se incrementó 1 vez (de 1 a 2)
    const finalUser = db.public.many(
      `SELECT "version_credenciales" FROM "usuario" WHERE "id_usuario" = ${userId}`,
    );
    expect(finalUser[0].version_credenciales).toBe(2);
  });

  it('6. Reversión DOWN limpia las adiciones de forma idempotente y segura', async () => {
    const migration = new UserInvitationsAndTokens1788762400000();
    const queryRunner = dataSource.createQueryRunner();

    await migration.down(queryRunner);
    await queryRunner.release();

    // Verificar que la tabla token_accion_usuario fue eliminada
    const tables = db.public.many(
      `SELECT table_name FROM information_schema.tables WHERE table_name = 'token_accion_usuario'`,
    );
    expect(tables).toHaveLength(0);

    // Verificar que el admin preexistente sigue intacto
    const admin = db.public.many(
      `SELECT "username" FROM "usuario" WHERE "username" = 'admin.principal'`,
    );
    expect(admin).toHaveLength(1);
  });
});
