import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDemoRole1788762600000 implements MigrationInterface {
  name = 'AddDemoRole1788762600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // 1. Actualizar el CHECK constraint del rol para incluir DEMO
      await queryRunner.query(
        `ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "CK_usuario_rol_valido";`,
      );
      await queryRunner.query(`
        ALTER TABLE "usuario" ADD CONSTRAINT "CK_usuario_rol_valido"
          CHECK ("rol" IN ('ADMIN', 'VENTAS', 'COMPRAS', 'CONSULTA', 'DEMO'));
      `);
    } else {
      // 1. Actualizar el CHECK constraint del rol para SQL Server
      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_usuario_rol_valido')
        BEGIN
          ALTER TABLE [usuario] DROP CONSTRAINT [CK_usuario_rol_valido];
        END
      `);
      await queryRunner.query(`
        ALTER TABLE [usuario] ADD CONSTRAINT [CK_usuario_rol_valido]
          CHECK ([rol] IN ('ADMIN', 'VENTAS', 'COMPRAS', 'CONSULTA', 'DEMO'));
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `UPDATE "usuario" SET "rol" = 'CONSULTA' WHERE "rol" = 'DEMO';`,
      );
      await queryRunner.query(
        `ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "CK_usuario_rol_valido";`,
      );
      await queryRunner.query(`
        ALTER TABLE "usuario" ADD CONSTRAINT "CK_usuario_rol_valido"
          CHECK ("rol" IN ('ADMIN', 'VENTAS', 'COMPRAS', 'CONSULTA'));
      `);
    } else {
      await queryRunner.query(
        `UPDATE [usuario] SET [rol] = 'CONSULTA' WHERE [rol] = 'DEMO';`,
      );
      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_usuario_rol_valido')
        BEGIN
          ALTER TABLE [usuario] DROP CONSTRAINT [CK_usuario_rol_valido];
        END
      `);
      await queryRunner.query(`
        ALTER TABLE [usuario] ADD CONSTRAINT [CK_usuario_rol_valido]
          CHECK ([rol] IN ('ADMIN', 'VENTAS', 'COMPRAS', 'CONSULTA'));
      `);
    }
  }
}

