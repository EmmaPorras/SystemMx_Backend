import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserInvitationsAndTokens1788762400000 implements MigrationInterface {
  name = 'UserInvitationsAndTokens1788762400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // -------------------------------------------------------------
      // DIALECTO: PostgreSQL (Neon / Render)
      // -------------------------------------------------------------
      await queryRunner.query(`ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "email" varchar(255);`);
      await queryRunner.query(`ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "email_normalizado" varchar(255);`);
      await queryRunner.query(`ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "estado_activacion" varchar(30) NOT NULL DEFAULT 'ACTIVO';`);

      // Asegurar que usuarios existentes sin estado tengan 'ACTIVO'
      await queryRunner.query(`UPDATE "usuario" SET "estado_activacion" = 'ACTIVO';`);

      await queryRunner.query(`ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "CK_usuario_estado_activacion";`);
      await queryRunner.query(`
        ALTER TABLE "usuario" ADD CONSTRAINT "CK_usuario_estado_activacion"
          CHECK ("estado_activacion" IN ('ACTIVO', 'PENDIENTE_ACTIVACION'));
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UX_usuario_email_normalizado"
        ON "usuario" ("email_normalizado")
        WHERE "email_normalizado" IS NOT NULL;
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "token_accion_usuario" (
          "id_token" SERIAL NOT NULL,
          "id_usuario" int NOT NULL,
          "tipo" varchar(30) NOT NULL,
          "token_hash" varchar(64) NOT NULL,
          "expira_en" timestamptz NOT NULL,
          "usado" boolean NOT NULL DEFAULT false,
          "usado_en" timestamptz,
          "ip_solicitud" varchar(50),
          "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_token_accion_usuario" PRIMARY KEY ("id_token"),
          CONSTRAINT "CK_token_accion_tipo" CHECK ("tipo" IN ('INVITACION', 'RECUPERACION_PASSWORD')),
          CONSTRAINT "FK_token_accion_usuario_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE
        );
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IX_token_accion_hash"
        ON "token_accion_usuario" ("token_hash");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IX_token_accion_usuario_tipo"
        ON "token_accion_usuario" ("id_usuario", "tipo", "usado");
      `);
    } else {
      // -------------------------------------------------------------
      // DIALECTO: SQL Server / Azure SQL (Desarrollo local)
      // -------------------------------------------------------------
      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[usuario]') AND name = 'email')
        BEGIN
          ALTER TABLE [usuario] ADD [email] nvarchar(255) NULL;
        END
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[usuario]') AND name = 'email_normalizado')
        BEGIN
          ALTER TABLE [usuario] ADD [email_normalizado] nvarchar(255) NULL;
        END
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[usuario]') AND name = 'estado_activacion')
        BEGIN
          ALTER TABLE [usuario] ADD [estado_activacion] nvarchar(30) NOT NULL CONSTRAINT [DF_usuario_estado_activacion] DEFAULT 'ACTIVO';
        END
      `);

      await queryRunner.query(`
        UPDATE [usuario] SET [estado_activacion] = 'ACTIVO';
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_usuario_estado_activacion')
        BEGIN
          ALTER TABLE [usuario] ADD CONSTRAINT [CK_usuario_estado_activacion] CHECK ([estado_activacion] IN ('ACTIVO', 'PENDIENTE_ACTIVACION'));
        END
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_usuario_email_normalizado')
        BEGIN
          CREATE UNIQUE INDEX [UX_usuario_email_normalizado] ON [usuario] ([email_normalizado]) WHERE [email_normalizado] IS NOT NULL;
        END
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'token_accion_usuario')
        BEGIN
          CREATE TABLE [token_accion_usuario] (
            [id_token] int NOT NULL IDENTITY(1,1),
            [id_usuario] int NOT NULL,
            [tipo] nvarchar(30) NOT NULL,
            [token_hash] nvarchar(64) NOT NULL,
            [expira_en] datetime2 NOT NULL,
            [usado] bit NOT NULL CONSTRAINT [DF_token_accion_usado] DEFAULT 0,
            [usado_en] datetime2 NULL,
            [ip_solicitud] nvarchar(50) NULL,
            [created_at] datetime2 NOT NULL CONSTRAINT [DF_token_accion_created_at] DEFAULT GETDATE(),
            CONSTRAINT [PK_token_accion_usuario] PRIMARY KEY ([id_token]),
            CONSTRAINT [CK_token_accion_tipo] CHECK ([tipo] IN ('INVITACION', 'RECUPERACION_PASSWORD')),
            CONSTRAINT [FK_token_accion_usuario_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [usuario]([id_usuario]) ON DELETE CASCADE
          );
        END
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_token_accion_hash')
        BEGIN
          CREATE INDEX [IX_token_accion_hash] ON [token_accion_usuario] ([token_hash]);
        END
      `);

      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_token_accion_usuario_tipo')
        BEGIN
          CREATE INDEX [IX_token_accion_usuario_tipo] ON [token_accion_usuario] ([id_usuario], [tipo], [usado]);
        END
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE IF EXISTS "token_accion_usuario" CASCADE;`);
      await queryRunner.query(`DROP INDEX IF EXISTS "UX_usuario_email_normalizado";`);
      await queryRunner.query(`ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "CK_usuario_estado_activacion";`);
      await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN IF EXISTS "estado_activacion";`);
      await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN IF EXISTS "email_normalizado";`);
      await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN IF EXISTS "email";`);
    } else {
      await queryRunner.query(`IF OBJECT_ID('token_accion_usuario', 'U') IS NOT NULL DROP TABLE [token_accion_usuario];`);
      await queryRunner.query(`IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_usuario_email_normalizado') DROP INDEX [UX_usuario_email_normalizado] ON [usuario];`);
      await queryRunner.query(`IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_usuario_estado_activacion') ALTER TABLE [usuario] DROP CONSTRAINT [CK_usuario_estado_activacion];`);
      await queryRunner.query(`IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_usuario_estado_activacion') ALTER TABLE [usuario] DROP CONSTRAINT [DF_usuario_estado_activacion];`);
      await queryRunner.query(`IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[usuario]') AND name = 'estado_activacion') ALTER TABLE [usuario] DROP COLUMN [estado_activacion];`);
      await queryRunner.query(`IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[usuario]') AND name = 'email_normalizado') ALTER TABLE [usuario] DROP COLUMN [email_normalizado];`);
      await queryRunner.query(`IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[usuario]') AND name = 'email') ALTER TABLE [usuario] DROP COLUMN [email];`);
    }
  }
}
