import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788762385395 implements MigrationInterface {
  name = 'InitialSchema1788762385395';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // -------------------------------------------------------------
      // DIALECTO: PostgreSQL (Neon / Render)
      // -------------------------------------------------------------
        await queryRunner.query(
          `CREATE TABLE "tarifa_iva" ("id_tarifa_iva" SERIAL NOT NULL, "codigo" varchar(20) NOT NULL, "descripcion" varchar(45) NOT NULL, "porcentaje" decimal(5,2) NOT NULL, "activo" boolean NOT NULL, "created_at" timestamptz NOT NULL CONSTRAINT "DF_3861ffe9eefb15c972b9baa3bd2" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_5267f079e8cddab8519795efe99" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_c4f3aab78b7071d448242357a77" PRIMARY KEY ("id_tarifa_iva"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_tarifa_iva_codigo" ON "tarifa_iva" ("codigo") `,
        );
        await queryRunner.query(
          `CREATE TABLE "producto" ("id_producto" SERIAL NOT NULL, "id_categoria" int, "id_tarifa_iva" int, "nombre" varchar(150) NOT NULL, "descripcion" varchar(255), "sku" varchar(100), "precio_venta_sugerido_sin_iva" decimal(12,2) NOT NULL, "stock_minimo" int NOT NULL, "activo" boolean NOT NULL, "marca" varchar(100), "variante" varchar(100), "imagen_url" varchar(500), "precio_venta_estandar_con_iva" decimal(12,2), "costo_referencia" decimal(12,2), "observaciones" varchar(255), "created_at" timestamptz NOT NULL CONSTRAINT "DF_601385106477cc00082e9b113eb" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_e7669a2c480ab4460f478dc3f58" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_e6f07eaa38082ffd9e20e961691" PRIMARY KEY ("id_producto"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_producto_nombre" ON "producto" ("nombre") `,
        );
        await queryRunner.query(
          `CREATE TABLE "categoria" ("id_categoria" SERIAL NOT NULL, "nombre" varchar(100) NOT NULL, "descripcion" varchar(255), "activo" boolean NOT NULL CONSTRAINT "DF_1fe0dba53b5439ba40b6674db4d" DEFAULT true, "created_at" timestamptz NOT NULL CONSTRAINT "DF_bb72aac4e58bd0e147cf82ff883" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_765c31f529a5aa1f3e7309b63ab" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_950063d23664f5aaec4dcada4d4" PRIMARY KEY ("id_categoria"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_categoria_nombre" ON "categoria" ("nombre") `,
        );
        await queryRunner.query(
          `CREATE TABLE "lote_producto" ("id_lote" SERIAL NOT NULL, "id_pedido" int NOT NULL, "id_producto" int NOT NULL, "id_detalle_pedido" int, "codigo_lote" varchar(10) NOT NULL, "cantidad_inicial" int NOT NULL, "cantidad_recibida" int NOT NULL, "cantidad_disponible" int NOT NULL, "costo_unitario_real" decimal(12,2) NOT NULL, "precio_venta_recomendado" decimal(12,2) NOT NULL, "estado_lote" varchar(30) NOT NULL, "fecha_entrada" date, "precio_venta_final" decimal(12,2), "tipo_lote" varchar(30) NOT NULL, "costo_pendiente_al_vender" decimal(12,2) NOT NULL, "observaciones" varchar(255), "created_at" timestamptz NOT NULL CONSTRAINT "DF_a6ffabea5a8b3602d6a42c0f3a9" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_922e2088577aef40ed3f3ad2917" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_e396cc806f59c98518e3be7cbb9" PRIMARY KEY ("id_lote"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_lote_producto_id_producto" ON "lote_producto" ("id_producto") `,
        );
        await queryRunner.query(
          `CREATE TABLE "origen_compra" ("id_origen_compra" SERIAL NOT NULL, "tipo_origen" varchar(50) NOT NULL, "nombre_referencia" varchar(150) NOT NULL, "contacto" varchar(150), "observaciones" text, "pais" varchar(100), "moneda_preferida" varchar(10), "telefono" varchar(20), "correo" varchar(100), "direccion" varchar(150), "estado" varchar(20) NOT NULL CONSTRAINT "DF_bfb973eb574a1da104d8362edae" DEFAULT 'ACTIVO', "created_at" timestamptz NOT NULL CONSTRAINT "DF_b5c42d4c3b11353fdd0014dc559" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_6b0cd928f87366e7fcc419544c3" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_2eb133edb95e201d32151485900" PRIMARY KEY ("id_origen_compra"))`,
        );
        await queryRunner.query(
          `CREATE TABLE "pedido_compra" ("id_pedido" SERIAL NOT NULL, "numero_pedido" int NOT NULL, "nombre_pedido" varchar(150) NOT NULL, "id_origen_compra" int NOT NULL, "fecha_pedido" date NOT NULL, "fecha_recepcion" date, "estado" varchar(30) NOT NULL, "inversion_total" decimal(12,2) NOT NULL, "costo_envio" decimal(12,2) NOT NULL, "impuestos_importacion" decimal(12,2) NOT NULL, "observaciones" varchar(255), "pais_compra" varchar(100), "moneda_compra" varchar(10) NOT NULL, "tipo_cambio" decimal(12,4) NOT NULL, "subtotal_productos" decimal(12,2) NOT NULL, "envio_interno" decimal(12,2) NOT NULL, "envio_casillero" decimal(12,2) NOT NULL, "otros_gastos" decimal(12,2) NOT NULL, "metodo_reparto_gastos" varchar(30) NOT NULL, "dias_duracion" int, "created_at" timestamptz NOT NULL CONSTRAINT "DF_14c383cd6cc58b7a99d28574174" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_cf2b2316dde8328a6eb9695ec31" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_266e079f5c04076dbaa3fa08277" PRIMARY KEY ("id_pedido"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_pedido_compra_numero_pedido" ON "pedido_compra" ("numero_pedido") `,
        );
        await queryRunner.query(
          `CREATE TABLE "detalle_pedido_compra" ("id_detalle_pedido" SERIAL NOT NULL, "id_pedido" int NOT NULL, "id_producto" int NOT NULL, "cantidad" int NOT NULL, "moneda_origen" varchar(10) NOT NULL, "costo_unitario_origen" decimal(12,2) NOT NULL, "total_origen" decimal(12,2) NOT NULL, "tipo_cambio" decimal(12,4) NOT NULL, "total_colones" decimal(12,2) NOT NULL, "envio_asignado" decimal(12,2) NOT NULL, "impuestos_asignados" decimal(12,2) NOT NULL, "otros_gastos_asignados" decimal(12,2) NOT NULL, "costo_total_real" decimal(12,2) NOT NULL, "costo_unitario_real" decimal(12,2) NOT NULL, "precio_venta_sugerido" decimal(12,2), "precio_venta_final" decimal(12,2), "metodo_reparto_gastos" varchar(30) NOT NULL, "observaciones" varchar(255), "created_at" timestamptz NOT NULL CONSTRAINT "DF_4de548079ee9ad445a7b9a7c277" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_3f1d416230c30de2545defd916e" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_54ecec7dc8c224bc6908d56f262" PRIMARY KEY ("id_detalle_pedido"))`,
        );
        await queryRunner.query(
          `CREATE TABLE "usuario" ("id_usuario" SERIAL NOT NULL, "username" varchar(50) NOT NULL, "username_normalizado" varchar(50) NOT NULL, "nombre" varchar(100) NOT NULL, "password_hash" varchar(255) NOT NULL, "rol" varchar(30) NOT NULL CONSTRAINT "DF_5a876a6cd6c2e6dff470f3de8a7" DEFAULT 'CONSULTA', "activo" boolean NOT NULL CONSTRAINT "DF_0ee0a06cade216e53df4daacd50" DEFAULT true, "version_credenciales" int NOT NULL CONSTRAINT "DF_f49903d4e57438fa2c52d6662ec" DEFAULT 1, "created_at" timestamptz NOT NULL CONSTRAINT "DF_55d783cc59bad7d90c9b460f086" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_25ea7643d8599698c195290c474" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CK_usuario_version_credenciales" CHECK ("version_credenciales" >= 1), CONSTRAINT "CK_usuario_rol_valido" CHECK ("rol" IN ('ADMIN', 'OPERADOR', 'CONSULTA')), CONSTRAINT "CK_usuario_username_normalizado_longitud" CHECK (char_length(trim("username_normalizado")) >= 3), CONSTRAINT "CK_usuario_username_longitud" CHECK (char_length(trim("username")) >= 3), CONSTRAINT "PK_dd52716c2652e0e23c15530c695" PRIMARY KEY ("id_usuario"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_usuario_username_normalizado" ON "usuario" ("username_normalizado") `,
        );
        await queryRunner.query(
          `CREATE TABLE "pago_venta" ("id_pago_venta" SERIAL NOT NULL, "id_venta" int NOT NULL, "id_usuario" int, "usuario" varchar(100), "metodo_pago" varchar(50) NOT NULL, "monto" decimal(12,2) NOT NULL, "referencia" varchar(150), "observaciones" varchar(255), "created_at" timestamptz NOT NULL CONSTRAINT "DF_76b4836c04b57e65d83db4c1e1a" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_e8a0358a3976cfa3da429eafcb5" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CK_pago_venta_monto_positivo" CHECK ("monto" > 0), CONSTRAINT "PK_fa64cdbf8ef64f353ade77916eb" PRIMARY KEY ("id_pago_venta"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_pago_venta_usuario_created" ON "pago_venta" ("id_usuario", "created_at") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_pago_venta_id_venta_created" ON "pago_venta" ("id_venta", "created_at") `,
        );
        await queryRunner.query(
          `CREATE TABLE "venta" ("id_venta" SERIAL NOT NULL, "numero_venta" int NOT NULL, "fecha_venta" date NOT NULL, "cliente_nombre" varchar(100), "medio_pago" varchar(30) NOT NULL, "estado_pago" varchar(30) NOT NULL, "estado_venta" varchar(30) NOT NULL, "subtotal" decimal(12,2) NOT NULL, "descuento_total" decimal(12,2) NOT NULL, "iva_total" decimal(12,2) NOT NULL, "total_venta" decimal(12,2) NOT NULL, "monto_pagado" decimal(12,2) NOT NULL, "saldo_pendiente" decimal(12,2) NOT NULL, "costo_total" decimal(12,2) NOT NULL, "ganancia_bruta" decimal(12,2) NOT NULL, "margen_bruto" decimal(12,2) NOT NULL, "fecha_entrega" date, "fecha_vencimiento_pago" date, "observaciones" varchar(150), "en_papelera" boolean NOT NULL, "created_at" timestamptz NOT NULL CONSTRAINT "DF_46b25234fca81cc2aaa7ce155c5" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_d4d62849ef1e38bb802ab690dd2" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UQ_9cc9c37e16aa9b9bb7162074277" UNIQUE ("numero_venta"), CONSTRAINT "PK_043bab63d9340c363d43981abd8" PRIMARY KEY ("id_venta"))`,
        );
        await queryRunner.query(
          `CREATE TABLE "detalle_venta" ("id_detalle_venta" SERIAL NOT NULL, "id_venta" int NOT NULL, "id_producto" int NOT NULL, "id_lote" int NOT NULL, "cantidad" int NOT NULL, "precio_unitario" decimal(12,2) NOT NULL, "subtotal" decimal(12,2) NOT NULL, "descuento" decimal(12,2) NOT NULL, "base_imponible" decimal(12,2) NOT NULL, "tipo_tarifa" varchar(30) NOT NULL, "id_tarifa_iva" int, "porcentaje_iva" decimal(5,2) NOT NULL, "iva" decimal(12,2) NOT NULL, "total_linea" decimal(12,2) NOT NULL, "costo_unitario_real" decimal(12,2) NOT NULL, "costo_total" decimal(12,2) NOT NULL, "ganancia_bruta" decimal(12,2) NOT NULL, "modo_descuento_lote" varchar(30) NOT NULL, "detalle" varchar(150), "created_at" timestamptz NOT NULL CONSTRAINT "DF_845fb36643ec6cfc5d1ff798692" DEFAULT CURRENT_TIMESTAMP, "updated_at" timestamptz NOT NULL CONSTRAINT "DF_5e8be48744df375e6f67bac18a5" DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PK_6f82cbdcb2490fde276fb57074d" PRIMARY KEY ("id_detalle_venta"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_detalle_venta_id_lote" ON "detalle_venta" ("id_lote") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_detalle_venta_id_producto" ON "detalle_venta" ("id_producto") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_detalle_venta_id_venta" ON "detalle_venta" ("id_venta") `,
        );
        await queryRunner.query(
          `CREATE TABLE "movimiento_inventario" ("id_movimiento" SERIAL NOT NULL, "id_producto" int NOT NULL, "id_lote" int NOT NULL, "fecha_movimiento" timestamptz NOT NULL CONSTRAINT "DF_33ad81611322aefcc1372c131da" DEFAULT CURRENT_TIMESTAMP, "tipo_movimiento" varchar(50) NOT NULL, "cantidad" int NOT NULL, "observaciones" varchar(500), "referencia_tipo" varchar(30) NOT NULL, "referencia_id" int NOT NULL, "id_usuario" int, "usuario" varchar(100), "motivo" varchar(255) NOT NULL, "costo_unitario" decimal(12,2) NOT NULL, "total_movimiento" decimal(14,2) NOT NULL, CONSTRAINT "CK_movimiento_inventario_total_no_negativo" CHECK ("total_movimiento" >= 0), CONSTRAINT "CK_movimiento_inventario_costo_no_negativo" CHECK ("costo_unitario" >= 0), CONSTRAINT "CK_movimiento_inventario_cantidad_positiva" CHECK ("cantidad" > 0), CONSTRAINT "PK_d4e7a663183e77b57193d8dee44" PRIMARY KEY ("id_movimiento"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_referencia" ON "movimiento_inventario" ("referencia_tipo", "referencia_id") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_usuario_fecha" ON "movimiento_inventario" ("id_usuario", "fecha_movimiento") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_lote_fecha" ON "movimiento_inventario" ("id_lote", "fecha_movimiento") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_producto_fecha" ON "movimiento_inventario" ("id_producto", "fecha_movimiento") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_fecha" ON "movimiento_inventario" ("fecha_movimiento") `,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" ADD CONSTRAINT "FK_e87a319f3da1b6da5fedd1988be" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" ADD CONSTRAINT "FK_bb55bf66555c9ea7b9b256affbc" FOREIGN KEY ("id_tarifa_iva") REFERENCES "tarifa_iva"("id_tarifa_iva") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" ADD CONSTRAINT "FK_5a1e5979a9ce59640364d6cc64e" FOREIGN KEY ("id_pedido") REFERENCES "pedido_compra"("id_pedido") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" ADD CONSTRAINT "FK_004eaebf224e376c82ead3979b2" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" ADD CONSTRAINT "FK_949d4109d31067885014ffbc1b0" FOREIGN KEY ("id_detalle_pedido") REFERENCES "detalle_pedido_compra"("id_detalle_pedido") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "pedido_compra" ADD CONSTRAINT "FK_fa71a97ad38cd5198b843f0c3b3" FOREIGN KEY ("id_origen_compra") REFERENCES "origen_compra"("id_origen_compra") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" ADD CONSTRAINT "FK_d8d1206f3c7652980d8b41eb587" FOREIGN KEY ("id_pedido") REFERENCES "pedido_compra"("id_pedido") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" ADD CONSTRAINT "FK_53b57c49c9afb781691212cf2b6" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" ADD CONSTRAINT "FK_96f5772bfe274571934cc838a13" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" ADD CONSTRAINT "FK_f1bf82c669022a82aa7289b8e69" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_175fd103d258655939b7fa81530" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_46042990544850e9e972c1961e8" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_87f11615e50283eb56a6ef39bff" FOREIGN KEY ("id_lote") REFERENCES "lote_producto"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "FK_bc9250e8e725bea7c88856d4a1a" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "FK_5802b9dde80ffe8e7e41e6d85cc" FOREIGN KEY ("id_lote") REFERENCES "lote_producto"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "FK_78c80989374bb530490bb60eb37" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    } else {
      // -------------------------------------------------------------
      // DIALECTO: SQL Server (Desarrollo local / E2E)
      // -------------------------------------------------------------
        await queryRunner.query(
          `CREATE TABLE "tarifa_iva" ("id_tarifa_iva" int NOT NULL IDENTITY(1,1), "codigo" nvarchar(20) NOT NULL, "descripcion" nvarchar(45) NOT NULL, "porcentaje" decimal(5,2) NOT NULL, "activo" bit NOT NULL, "created_at" datetime2 NOT NULL CONSTRAINT "DF_3861ffe9eefb15c972b9baa3bd2" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_5267f079e8cddab8519795efe99" DEFAULT getdate(), CONSTRAINT "PK_c4f3aab78b7071d448242357a77" PRIMARY KEY ("id_tarifa_iva"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_tarifa_iva_codigo" ON "tarifa_iva" ("codigo") `,
        );
        await queryRunner.query(
          `CREATE TABLE "producto" ("id_producto" int NOT NULL IDENTITY(1,1), "id_categoria" int, "id_tarifa_iva" int, "nombre" nvarchar(150) NOT NULL, "descripcion" nvarchar(255), "sku" nvarchar(100), "precio_venta_sugerido_sin_iva" decimal(12,2) NOT NULL, "stock_minimo" int NOT NULL, "activo" bit NOT NULL, "marca" nvarchar(100), "variante" nvarchar(100), "imagen_url" nvarchar(500), "precio_venta_estandar_con_iva" decimal(12,2), "costo_referencia" decimal(12,2), "observaciones" nvarchar(255), "created_at" datetime2 NOT NULL CONSTRAINT "DF_601385106477cc00082e9b113eb" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_e7669a2c480ab4460f478dc3f58" DEFAULT getdate(), CONSTRAINT "PK_e6f07eaa38082ffd9e20e961691" PRIMARY KEY ("id_producto"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_producto_nombre" ON "producto" ("nombre") `,
        );
        await queryRunner.query(
          `CREATE TABLE "categoria" ("id_categoria" int NOT NULL IDENTITY(1,1), "nombre" nvarchar(100) NOT NULL, "descripcion" nvarchar(255), "activo" bit NOT NULL CONSTRAINT "DF_1fe0dba53b5439ba40b6674db4d" DEFAULT 1, "created_at" datetime2 NOT NULL CONSTRAINT "DF_bb72aac4e58bd0e147cf82ff883" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_765c31f529a5aa1f3e7309b63ab" DEFAULT getdate(), CONSTRAINT "PK_950063d23664f5aaec4dcada4d4" PRIMARY KEY ("id_categoria"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_categoria_nombre" ON "categoria" ("nombre") `,
        );
        await queryRunner.query(
          `CREATE TABLE "lote_producto" ("id_lote" int NOT NULL IDENTITY(1,1), "id_pedido" int NOT NULL, "id_producto" int NOT NULL, "id_detalle_pedido" int, "codigo_lote" nvarchar(10) NOT NULL, "cantidad_inicial" int NOT NULL, "cantidad_recibida" int NOT NULL, "cantidad_disponible" int NOT NULL, "costo_unitario_real" decimal(12,2) NOT NULL, "precio_venta_recomendado" decimal(12,2) NOT NULL, "estado_lote" nvarchar(30) NOT NULL, "fecha_entrada" date, "precio_venta_final" decimal(12,2), "tipo_lote" nvarchar(30) NOT NULL, "costo_pendiente_al_vender" decimal(12,2) NOT NULL, "observaciones" nvarchar(255), "created_at" datetime2 NOT NULL CONSTRAINT "DF_a6ffabea5a8b3602d6a42c0f3a9" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_922e2088577aef40ed3f3ad2917" DEFAULT getdate(), CONSTRAINT "PK_e396cc806f59c98518e3be7cbb9" PRIMARY KEY ("id_lote"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_lote_producto_id_producto" ON "lote_producto" ("id_producto") `,
        );
        await queryRunner.query(
          `CREATE TABLE "origen_compra" ("id_origen_compra" int NOT NULL IDENTITY(1,1), "tipo_origen" nvarchar(50) NOT NULL, "nombre_referencia" nvarchar(150) NOT NULL, "contacto" nvarchar(150), "observaciones" nvarchar(MAX), "pais" nvarchar(100), "moneda_preferida" nvarchar(10), "telefono" nvarchar(20), "correo" nvarchar(100), "direccion" nvarchar(150), "estado" nvarchar(20) NOT NULL CONSTRAINT "DF_bfb973eb574a1da104d8362edae" DEFAULT 'ACTIVO', "created_at" datetime2 NOT NULL CONSTRAINT "DF_b5c42d4c3b11353fdd0014dc559" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_6b0cd928f87366e7fcc419544c3" DEFAULT getdate(), CONSTRAINT "PK_2eb133edb95e201d32151485900" PRIMARY KEY ("id_origen_compra"))`,
        );
        await queryRunner.query(
          `CREATE TABLE "pedido_compra" ("id_pedido" int NOT NULL IDENTITY(1,1), "numero_pedido" int NOT NULL, "nombre_pedido" nvarchar(150) NOT NULL, "id_origen_compra" int NOT NULL, "fecha_pedido" date NOT NULL, "fecha_recepcion" date, "estado" nvarchar(30) NOT NULL, "inversion_total" decimal(12,2) NOT NULL, "costo_envio" decimal(12,2) NOT NULL, "impuestos_importacion" decimal(12,2) NOT NULL, "observaciones" nvarchar(255), "pais_compra" nvarchar(100), "moneda_compra" nvarchar(10) NOT NULL, "tipo_cambio" decimal(12,4) NOT NULL, "subtotal_productos" decimal(12,2) NOT NULL, "envio_interno" decimal(12,2) NOT NULL, "envio_casillero" decimal(12,2) NOT NULL, "otros_gastos" decimal(12,2) NOT NULL, "metodo_reparto_gastos" nvarchar(30) NOT NULL, "dias_duracion" int, "created_at" datetime2 NOT NULL CONSTRAINT "DF_14c383cd6cc58b7a99d28574174" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_cf2b2316dde8328a6eb9695ec31" DEFAULT getdate(), CONSTRAINT "PK_266e079f5c04076dbaa3fa08277" PRIMARY KEY ("id_pedido"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_pedido_compra_numero_pedido" ON "pedido_compra" ("numero_pedido") `,
        );
        await queryRunner.query(
          `CREATE TABLE "detalle_pedido_compra" ("id_detalle_pedido" int NOT NULL IDENTITY(1,1), "id_pedido" int NOT NULL, "id_producto" int NOT NULL, "cantidad" int NOT NULL, "moneda_origen" nvarchar(10) NOT NULL, "costo_unitario_origen" decimal(12,2) NOT NULL, "total_origen" decimal(12,2) NOT NULL, "tipo_cambio" decimal(12,4) NOT NULL, "total_colones" decimal(12,2) NOT NULL, "envio_asignado" decimal(12,2) NOT NULL, "impuestos_asignados" decimal(12,2) NOT NULL, "otros_gastos_asignados" decimal(12,2) NOT NULL, "costo_total_real" decimal(12,2) NOT NULL, "costo_unitario_real" decimal(12,2) NOT NULL, "precio_venta_sugerido" decimal(12,2), "precio_venta_final" decimal(12,2), "metodo_reparto_gastos" nvarchar(30) NOT NULL, "observaciones" nvarchar(255), "created_at" datetime2 NOT NULL CONSTRAINT "DF_4de548079ee9ad445a7b9a7c277" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_3f1d416230c30de2545defd916e" DEFAULT getdate(), CONSTRAINT "PK_54ecec7dc8c224bc6908d56f262" PRIMARY KEY ("id_detalle_pedido"))`,
        );
        await queryRunner.query(
          `CREATE TABLE "usuario" ("id_usuario" int NOT NULL IDENTITY(1,1), "username" nvarchar(50) NOT NULL, "username_normalizado" nvarchar(50) NOT NULL, "nombre" nvarchar(100) NOT NULL, "password_hash" nvarchar(255) NOT NULL, "rol" nvarchar(30) NOT NULL CONSTRAINT "DF_5a876a6cd6c2e6dff470f3de8a7" DEFAULT 'CONSULTA', "activo" bit NOT NULL CONSTRAINT "DF_0ee0a06cade216e53df4daacd50" DEFAULT 1, "version_credenciales" int NOT NULL CONSTRAINT "DF_f49903d4e57438fa2c52d6662ec" DEFAULT 1, "created_at" datetime2 NOT NULL CONSTRAINT "DF_55d783cc59bad7d90c9b460f086" DEFAULT GETDATE(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_25ea7643d8599698c195290c474" DEFAULT GETDATE(), CONSTRAINT "CK_usuario_version_credenciales" CHECK ([version_credenciales] >= 1), CONSTRAINT "CK_usuario_rol_valido" CHECK ([rol] IN ('ADMIN', 'OPERADOR', 'CONSULTA')), CONSTRAINT "CK_usuario_username_normalizado_longitud" CHECK (LEN(LTRIM(RTRIM([username_normalizado]))) >= 3), CONSTRAINT "CK_usuario_username_longitud" CHECK (LEN(LTRIM(RTRIM([username]))) >= 3), CONSTRAINT "PK_dd52716c2652e0e23c15530c695" PRIMARY KEY ("id_usuario"))`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "UX_usuario_username_normalizado" ON "usuario" ("username_normalizado") `,
        );
        await queryRunner.query(
          `CREATE TABLE "pago_venta" ("id_pago_venta" int NOT NULL IDENTITY(1,1), "id_venta" int NOT NULL, "id_usuario" int, "usuario" nvarchar(100), "metodo_pago" nvarchar(50) NOT NULL, "monto" decimal(12,2) NOT NULL, "referencia" nvarchar(150), "observaciones" nvarchar(255), "created_at" datetime2 NOT NULL CONSTRAINT "DF_76b4836c04b57e65d83db4c1e1a" DEFAULT GETDATE(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_e8a0358a3976cfa3da429eafcb5" DEFAULT GETDATE(), CONSTRAINT "CK_pago_venta_monto_positivo" CHECK ([monto] > 0), CONSTRAINT "PK_fa64cdbf8ef64f353ade77916eb" PRIMARY KEY ("id_pago_venta"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_pago_venta_usuario_created" ON "pago_venta" ("id_usuario", "created_at") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_pago_venta_id_venta_created" ON "pago_venta" ("id_venta", "created_at") `,
        );
        await queryRunner.query(
          `CREATE TABLE "venta" ("id_venta" int NOT NULL IDENTITY(1,1), "numero_venta" int NOT NULL, "fecha_venta" date NOT NULL, "cliente_nombre" nvarchar(100), "medio_pago" nvarchar(30) NOT NULL, "estado_pago" nvarchar(30) NOT NULL, "estado_venta" nvarchar(30) NOT NULL, "subtotal" decimal(12,2) NOT NULL, "descuento_total" decimal(12,2) NOT NULL, "iva_total" decimal(12,2) NOT NULL, "total_venta" decimal(12,2) NOT NULL, "monto_pagado" decimal(12,2) NOT NULL, "saldo_pendiente" decimal(12,2) NOT NULL, "costo_total" decimal(12,2) NOT NULL, "ganancia_bruta" decimal(12,2) NOT NULL, "margen_bruto" decimal(12,2) NOT NULL, "fecha_entrega" date, "fecha_vencimiento_pago" date, "observaciones" nvarchar(150), "en_papelera" bit NOT NULL, "created_at" datetime2 NOT NULL CONSTRAINT "DF_46b25234fca81cc2aaa7ce155c5" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_d4d62849ef1e38bb802ab690dd2" DEFAULT getdate(), CONSTRAINT "UQ_9cc9c37e16aa9b9bb7162074277" UNIQUE ("numero_venta"), CONSTRAINT "PK_043bab63d9340c363d43981abd8" PRIMARY KEY ("id_venta"))`,
        );
        await queryRunner.query(
          `CREATE TABLE "detalle_venta" ("id_detalle_venta" int NOT NULL IDENTITY(1,1), "id_venta" int NOT NULL, "id_producto" int NOT NULL, "id_lote" int NOT NULL, "cantidad" int NOT NULL, "precio_unitario" decimal(12,2) NOT NULL, "subtotal" decimal(12,2) NOT NULL, "descuento" decimal(12,2) NOT NULL, "base_imponible" decimal(12,2) NOT NULL, "tipo_tarifa" nvarchar(30) NOT NULL, "id_tarifa_iva" int, "porcentaje_iva" decimal(5,2) NOT NULL, "iva" decimal(12,2) NOT NULL, "total_linea" decimal(12,2) NOT NULL, "costo_unitario_real" decimal(12,2) NOT NULL, "costo_total" decimal(12,2) NOT NULL, "ganancia_bruta" decimal(12,2) NOT NULL, "modo_descuento_lote" nvarchar(30) NOT NULL, "detalle" nvarchar(150), "created_at" datetime2 NOT NULL CONSTRAINT "DF_845fb36643ec6cfc5d1ff798692" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_5e8be48744df375e6f67bac18a5" DEFAULT getdate(), CONSTRAINT "PK_6f82cbdcb2490fde276fb57074d" PRIMARY KEY ("id_detalle_venta"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_detalle_venta_id_lote" ON "detalle_venta" ("id_lote") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_detalle_venta_id_producto" ON "detalle_venta" ("id_producto") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_detalle_venta_id_venta" ON "detalle_venta" ("id_venta") `,
        );
        await queryRunner.query(
          `CREATE TABLE "movimiento_inventario" ("id_movimiento" int NOT NULL IDENTITY(1,1), "id_producto" int NOT NULL, "id_lote" int NOT NULL, "fecha_movimiento" datetime2 NOT NULL CONSTRAINT "DF_33ad81611322aefcc1372c131da" DEFAULT GETDATE(), "tipo_movimiento" nvarchar(50) NOT NULL, "cantidad" int NOT NULL, "observaciones" nvarchar(500), "referencia_tipo" nvarchar(30) NOT NULL, "referencia_id" int NOT NULL, "id_usuario" int, "usuario" nvarchar(100), "motivo" nvarchar(255) NOT NULL, "costo_unitario" decimal(12,2) NOT NULL, "total_movimiento" decimal(14,2) NOT NULL, CONSTRAINT "CK_movimiento_inventario_total_no_negativo" CHECK ([total_movimiento] >= 0), CONSTRAINT "CK_movimiento_inventario_costo_no_negativo" CHECK ([costo_unitario] >= 0), CONSTRAINT "CK_movimiento_inventario_cantidad_positiva" CHECK ([cantidad] > 0), CONSTRAINT "PK_d4e7a663183e77b57193d8dee44" PRIMARY KEY ("id_movimiento"))`,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_referencia" ON "movimiento_inventario" ("referencia_tipo", "referencia_id") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_usuario_fecha" ON "movimiento_inventario" ("id_usuario", "fecha_movimiento") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_lote_fecha" ON "movimiento_inventario" ("id_lote", "fecha_movimiento") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_producto_fecha" ON "movimiento_inventario" ("id_producto", "fecha_movimiento") `,
        );
        await queryRunner.query(
          `CREATE INDEX "IX_movimiento_inventario_fecha" ON "movimiento_inventario" ("fecha_movimiento") `,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" ADD CONSTRAINT "FK_e87a319f3da1b6da5fedd1988be" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" ADD CONSTRAINT "FK_bb55bf66555c9ea7b9b256affbc" FOREIGN KEY ("id_tarifa_iva") REFERENCES "tarifa_iva"("id_tarifa_iva") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" ADD CONSTRAINT "FK_5a1e5979a9ce59640364d6cc64e" FOREIGN KEY ("id_pedido") REFERENCES "pedido_compra"("id_pedido") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" ADD CONSTRAINT "FK_004eaebf224e376c82ead3979b2" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" ADD CONSTRAINT "FK_949d4109d31067885014ffbc1b0" FOREIGN KEY ("id_detalle_pedido") REFERENCES "detalle_pedido_compra"("id_detalle_pedido") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "pedido_compra" ADD CONSTRAINT "FK_fa71a97ad38cd5198b843f0c3b3" FOREIGN KEY ("id_origen_compra") REFERENCES "origen_compra"("id_origen_compra") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" ADD CONSTRAINT "FK_d8d1206f3c7652980d8b41eb587" FOREIGN KEY ("id_pedido") REFERENCES "pedido_compra"("id_pedido") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" ADD CONSTRAINT "FK_53b57c49c9afb781691212cf2b6" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" ADD CONSTRAINT "FK_96f5772bfe274571934cc838a13" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" ADD CONSTRAINT "FK_f1bf82c669022a82aa7289b8e69" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_175fd103d258655939b7fa81530" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_46042990544850e9e972c1961e8" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_87f11615e50283eb56a6ef39bff" FOREIGN KEY ("id_lote") REFERENCES "lote_producto"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "FK_bc9250e8e725bea7c88856d4a1a" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "FK_5802b9dde80ffe8e7e41e6d85cc" FOREIGN KEY ("id_lote") REFERENCES "lote_producto"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "FK_78c80989374bb530490bb60eb37" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // -------------------------------------------------------------
      // DIALECTO: PostgreSQL (Neon / Render)
      // -------------------------------------------------------------
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "FK_78c80989374bb530490bb60eb37"`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "FK_5802b9dde80ffe8e7e41e6d85cc"`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "FK_bc9250e8e725bea7c88856d4a1a"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_87f11615e50283eb56a6ef39bff"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_46042990544850e9e972c1961e8"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_175fd103d258655939b7fa81530"`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" DROP CONSTRAINT "FK_f1bf82c669022a82aa7289b8e69"`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" DROP CONSTRAINT "FK_96f5772bfe274571934cc838a13"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" DROP CONSTRAINT "FK_53b57c49c9afb781691212cf2b6"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" DROP CONSTRAINT "FK_d8d1206f3c7652980d8b41eb587"`,
        );
        await queryRunner.query(
          `ALTER TABLE "pedido_compra" DROP CONSTRAINT "FK_fa71a97ad38cd5198b843f0c3b3"`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" DROP CONSTRAINT "FK_949d4109d31067885014ffbc1b0"`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" DROP CONSTRAINT "FK_004eaebf224e376c82ead3979b2"`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" DROP CONSTRAINT "FK_5a1e5979a9ce59640364d6cc64e"`,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" DROP CONSTRAINT "FK_bb55bf66555c9ea7b9b256affbc"`,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" DROP CONSTRAINT "FK_e87a319f3da1b6da5fedd1988be"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_producto_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_lote_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_usuario_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_referencia" ON "movimiento_inventario"`,
        );
        await queryRunner.query(`DROP TABLE "movimiento_inventario"`);
        await queryRunner.query(
          `DROP INDEX "IX_detalle_venta_id_venta" ON "detalle_venta"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_detalle_venta_id_producto" ON "detalle_venta"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_detalle_venta_id_lote" ON "detalle_venta"`,
        );
        await queryRunner.query(`DROP TABLE "detalle_venta"`);
        await queryRunner.query(`DROP TABLE "venta"`);
        await queryRunner.query(
          `DROP INDEX "IX_pago_venta_id_venta_created" ON "pago_venta"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_pago_venta_usuario_created" ON "pago_venta"`,
        );
        await queryRunner.query(`DROP TABLE "pago_venta"`);
        await queryRunner.query(
          `DROP INDEX "UX_usuario_username_normalizado" ON "usuario"`,
        );
        await queryRunner.query(`DROP TABLE "usuario"`);
        await queryRunner.query(`DROP TABLE "detalle_pedido_compra"`);
        await queryRunner.query(
          `DROP INDEX "UX_pedido_compra_numero_pedido" ON "pedido_compra"`,
        );
        await queryRunner.query(`DROP TABLE "pedido_compra"`);
        await queryRunner.query(`DROP TABLE "origen_compra"`);
        await queryRunner.query(
          `DROP INDEX "IX_lote_producto_id_producto" ON "lote_producto"`,
        );
        await queryRunner.query(`DROP TABLE "lote_producto"`);
        await queryRunner.query(`DROP INDEX "UX_categoria_nombre" ON "categoria"`);
        await queryRunner.query(`DROP TABLE "categoria"`);
        await queryRunner.query(`DROP INDEX "UX_producto_nombre" ON "producto"`);
        await queryRunner.query(`DROP TABLE "producto"`);
        await queryRunner.query(
          `DROP INDEX "UX_tarifa_iva_codigo" ON "tarifa_iva"`,
        );
        await queryRunner.query(`DROP TABLE "tarifa_iva"`);
    } else {
      // -------------------------------------------------------------
      // DIALECTO: SQL Server (Desarrollo local / E2E)
      // -------------------------------------------------------------
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "FK_78c80989374bb530490bb60eb37"`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "FK_5802b9dde80ffe8e7e41e6d85cc"`,
        );
        await queryRunner.query(
          `ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "FK_bc9250e8e725bea7c88856d4a1a"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_87f11615e50283eb56a6ef39bff"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_46042990544850e9e972c1961e8"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_175fd103d258655939b7fa81530"`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" DROP CONSTRAINT "FK_f1bf82c669022a82aa7289b8e69"`,
        );
        await queryRunner.query(
          `ALTER TABLE "pago_venta" DROP CONSTRAINT "FK_96f5772bfe274571934cc838a13"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" DROP CONSTRAINT "FK_53b57c49c9afb781691212cf2b6"`,
        );
        await queryRunner.query(
          `ALTER TABLE "detalle_pedido_compra" DROP CONSTRAINT "FK_d8d1206f3c7652980d8b41eb587"`,
        );
        await queryRunner.query(
          `ALTER TABLE "pedido_compra" DROP CONSTRAINT "FK_fa71a97ad38cd5198b843f0c3b3"`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" DROP CONSTRAINT "FK_949d4109d31067885014ffbc1b0"`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" DROP CONSTRAINT "FK_004eaebf224e376c82ead3979b2"`,
        );
        await queryRunner.query(
          `ALTER TABLE "lote_producto" DROP CONSTRAINT "FK_5a1e5979a9ce59640364d6cc64e"`,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" DROP CONSTRAINT "FK_bb55bf66555c9ea7b9b256affbc"`,
        );
        await queryRunner.query(
          `ALTER TABLE "producto" DROP CONSTRAINT "FK_e87a319f3da1b6da5fedd1988be"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_producto_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_lote_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_usuario_fecha" ON "movimiento_inventario"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_movimiento_inventario_referencia" ON "movimiento_inventario"`,
        );
        await queryRunner.query(`DROP TABLE "movimiento_inventario"`);
        await queryRunner.query(
          `DROP INDEX "IX_detalle_venta_id_venta" ON "detalle_venta"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_detalle_venta_id_producto" ON "detalle_venta"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_detalle_venta_id_lote" ON "detalle_venta"`,
        );
        await queryRunner.query(`DROP TABLE "detalle_venta"`);
        await queryRunner.query(`DROP TABLE "venta"`);
        await queryRunner.query(
          `DROP INDEX "IX_pago_venta_id_venta_created" ON "pago_venta"`,
        );
        await queryRunner.query(
          `DROP INDEX "IX_pago_venta_usuario_created" ON "pago_venta"`,
        );
        await queryRunner.query(`DROP TABLE "pago_venta"`);
        await queryRunner.query(
          `DROP INDEX "UX_usuario_username_normalizado" ON "usuario"`,
        );
        await queryRunner.query(`DROP TABLE "usuario"`);
        await queryRunner.query(`DROP TABLE "detalle_pedido_compra"`);
        await queryRunner.query(
          `DROP INDEX "UX_pedido_compra_numero_pedido" ON "pedido_compra"`,
        );
        await queryRunner.query(`DROP TABLE "pedido_compra"`);
        await queryRunner.query(`DROP TABLE "origen_compra"`);
        await queryRunner.query(
          `DROP INDEX "IX_lote_producto_id_producto" ON "lote_producto"`,
        );
        await queryRunner.query(`DROP TABLE "lote_producto"`);
        await queryRunner.query(`DROP INDEX "UX_categoria_nombre" ON "categoria"`);
        await queryRunner.query(`DROP TABLE "categoria"`);
        await queryRunner.query(`DROP INDEX "UX_producto_nombre" ON "producto"`);
        await queryRunner.query(`DROP TABLE "producto"`);
        await queryRunner.query(
          `DROP INDEX "UX_tarifa_iva_codigo" ON "tarifa_iva"`,
        );
        await queryRunner.query(`DROP TABLE "tarifa_iva"`);
    }
  }
}
