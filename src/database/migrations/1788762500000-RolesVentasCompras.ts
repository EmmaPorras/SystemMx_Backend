import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolesVentasCompras1788762500000 implements MigrationInterface {
  name = 'RolesVentasCompras1788762500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // 1. Migración conservadora: 'OPERADOR' -> 'CONSULTA'
      await queryRunner.query(`UPDATE "usuario" SET "rol" = 'CONSULTA' WHERE "rol" = 'OPERADOR';`);

      // 2. Actualizar el CHECK constraint del rol
      await queryRunner.query(`ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "CK_usuario_rol_valido";`);
      await queryRunner.query(`
        ALTER TABLE "usuario" ADD CONSTRAINT "CK_usuario_rol_valido"
          CHECK ("rol" IN ('ADMIN', 'VENTAS', 'COMPRAS', 'CONSULTA'));
      `);
    } else {
      // 1. Migración conservadora: 'OPERADOR' -> 'CONSULTA'
      await queryRunner.query(`UPDATE [usuario] SET [rol] = 'CONSULTA' WHERE [rol] = 'OPERADOR';`);

      // 2. Actualizar el CHECK constraint del rol
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`UPDATE "usuario" SET "rol" = 'CONSULTA' WHERE "rol" IN ('VENTAS', 'COMPRAS');`);
      await queryRunner.query(`ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "CK_usuario_rol_valido";`);
      await queryRunner.query(`
        ALTER TABLE "usuario" ADD CONSTRAINT "CK_usuario_rol_valido"
          CHECK ("rol" IN ('ADMIN', 'OPERADOR', 'CONSULTA'));
      `);
    } else {
      await queryRunner.query(`UPDATE [usuario] SET [rol] = 'CONSULTA' WHERE [rol] IN ('VENTAS', 'COMPRAS');`);
      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_usuario_rol_valido')
        BEGIN
          ALTER TABLE [usuario] DROP CONSTRAINT [CK_usuario_rol_valido];
        END
      `);
      await queryRunner.query(`
        ALTER TABLE [usuario] ADD CONSTRAINT [CK_usuario_rol_valido]
          CHECK ([rol] IN ('ADMIN', 'OPERADOR', 'CONSULTA'));
      `);
    }
  }
}
