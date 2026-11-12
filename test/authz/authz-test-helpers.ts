/**
 * ============================================================================
 * HELPERS PARA PRUEBAS DE AUTORIZACIÓN Y CONTROL DE ACCESO (Ítem 4.5)
 * ============================================================================
 * Provee:
 * 1. Inicialización de la aplicación NestJS con AppModule y configuración segura.
 * 2. Siembra y limpieza determinista de datos de prueba en la base de datos efímera.
 * 3. Generación de credenciales, usuarios por rol y tokens JWT firmados.
 * 4. Métodos para comprobar la NO-MODIFICACIÓN de datos tras peticiones denegadas.
 * ============================================================================
 */

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { EstadoActivacionUsuario } from '../../src/modules/usuarios/estado-activacion.enum';
import { RolUsuario } from '../../src/modules/usuarios/rol-usuario.enum';
import { AuthzActor } from './matriz-permisos';

export interface AuthzTestContext {
  app: INestApplication;
  dataSource: DataSource;
  jwtService: JwtService;
  tokens: Record<AuthzActor, string>;
  usuarios: Record<
    string,
    { idUsuario: number; username: string; rol: RolUsuario }
  >;
  ventaId: number;
  ventaIdAdmin: number;
  ventaIdVentas: number;
  pedidoId: number;
  productoId: number;
  loteId: number;
}

export const AUTHZ_TEST_PASSWORD = 'TestAuthzPassword123!';

export async function createAuthzTestContext(): Promise<AuthzTestContext> {
  // Garantizar variables de entorno para ambiente de pruebas
  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.PORT || '3000';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ||
    'dummy_secret_key_for_ci_testing_at_least_32_chars';
  process.env.CORS_ORIGINS =
    process.env.CORS_ORIGINS || 'http://localhost:5173';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app, app.get(ConfigService));
  await app.init();

  const dataSource = app.get(DataSource);
  const jwtService = app.get(JwtService);

  // Sembrar datos de prueba
  const seedResult = await seedAuthzTestData(dataSource, jwtService);

  return {
    app,
    dataSource,
    jwtService,
    tokens: seedResult.tokens,
    usuarios: seedResult.usuarios,
    ventaId: seedResult.ventaId,
    ventaIdAdmin: seedResult.ventaIdAdmin,
    ventaIdVentas: seedResult.ventaIdVentas,
    pedidoId: seedResult.pedidoId,
    productoId: seedResult.productoId,
    loteId: seedResult.loteId,
  };
}

export async function cleanupAuthzTestData(
  dataSource: DataSource,
): Promise<void> {
  if (!dataSource.isInitialized) return;

  const qr = dataSource.createQueryRunner();
  await qr.connect();

  try {
    // Limpiar entidades de prueba con prefijo authz.
    await qr.query(
      `DELETE FROM "pago_venta" WHERE "notas" LIKE '%authz%' OR "usuario" LIKE 'authz.%'`,
    );
    await qr.query(
      `DELETE FROM "detalle_venta" WHERE "id_venta" IN (SELECT "id_venta" FROM "venta" WHERE "cliente_nombre" LIKE '%Authz%')`,
    );
    await qr.query(
      `DELETE FROM "movimiento_inventario" WHERE "observaciones" LIKE '%authz%'`,
    );
    await qr.query(`DELETE FROM "venta" WHERE "cliente_nombre" LIKE '%Authz%'`);
    await qr.query(
      `DELETE FROM "lote_producto" WHERE "codigo_lote" LIKE 'AZ-%'`,
    );
    await qr.query(
      `DELETE FROM "detalle_pedido_compra" WHERE "id_pedido" IN (SELECT "id_pedido" FROM "pedido_compra" WHERE "nombre_pedido" LIKE '%Authz%')`,
    );
    await qr.query(
      `DELETE FROM "pedido_compra" WHERE "nombre_pedido" LIKE '%Authz%'`,
    );
    await qr.query(`DELETE FROM "producto" WHERE "sku" LIKE 'SKU-AUTHZ-%'`);
    await qr.query(
      `DELETE FROM "categoria" WHERE "nombre" LIKE 'Categoria Authz%'`,
    );
    await qr.query(
      `DELETE FROM "origen_compra" WHERE "nombre_referencia" LIKE 'Proveedor Authz%'`,
    );
    await qr.query(`DELETE FROM "tarifa_iva" WHERE "codigo" = 'IVA_AUTHZ'`);
    await qr.query(
      `DELETE FROM "token_accion_usuario" WHERE "id_usuario" IN (SELECT "id_usuario" FROM "usuario" WHERE "username" LIKE 'authz.%')`,
    );
    await qr.query(`DELETE FROM "usuario" WHERE "username" LIKE 'authz.%'`);
  } catch (err) {
    // Si la tabla no existe o falla en ambiente no inicializado, continuar
  } finally {
    await qr.release();
  }
}

async function seedAuthzTestData(
  dataSource: DataSource,
  jwtService: JwtService,
): Promise<{
  tokens: Record<AuthzActor, string>;
  usuarios: Record<
    string,
    { idUsuario: number; username: string; rol: RolUsuario }
  >;
  ventaId: number;
  ventaIdAdmin: number;
  ventaIdVentas: number;
  pedidoId: number;
  productoId: number;
  loteId: number;
}> {
  await cleanupAuthzTestData(dataSource);

  const qr = dataSource.createQueryRunner();
  await qr.connect();

  try {
    const passwordHash = await argon2.hash(AUTHZ_TEST_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    // 1. Crear usuarios para cada rol
    const rolesToCreate = [
      { username: 'authz.admin', nombre: 'Admin Authz', rol: RolUsuario.ADMIN },
      {
        username: 'authz.admin2',
        nombre: 'Segundo Admin Authz',
        rol: RolUsuario.ADMIN,
      },
      {
        username: 'authz.ventas',
        nombre: 'Ventas Authz',
        rol: RolUsuario.VENTAS,
      },
      {
        username: 'authz.compras',
        nombre: 'Compras Authz',
        rol: RolUsuario.COMPRAS,
      },
      {
        username: 'authz.consulta',
        nombre: 'Consulta Authz',
        rol: RolUsuario.CONSULTA,
      },
      { username: 'authz.demo', nombre: 'Demo Authz', rol: RolUsuario.DEMO },
      {
        username: 'authz.target',
        nombre: 'Target Usuario Authz',
        rol: RolUsuario.CONSULTA,
      },
      {
        username: 'authz.rotacion',
        nombre: 'Rotacion Password Authz',
        rol: RolUsuario.CONSULTA,
      },
    ];

    const usuariosMap: Record<
      string,
      { idUsuario: number; username: string; rol: RolUsuario }
    > = {};

    for (const u of rolesToCreate) {
      const res = await qr.query(
        `INSERT INTO "usuario" (
          "username", "username_normalizado", "nombre", "password_hash",
          "rol", "activo", "version_credenciales", "estado_activacion"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING "id_usuario"`,
        [
          u.username,
          u.username.toLowerCase(),
          u.nombre,
          passwordHash,
          u.rol,
          true,
          1,
          EstadoActivacionUsuario.ACTIVO,
        ],
      );
      usuariosMap[u.username] = {
        idUsuario: res[0].id_usuario,
        username: u.username,
        rol: u.rol,
      };
    }

    // 2. Generar tokens JWT para cada rol
    const tokens: Record<AuthzActor, string> = {
      [RolUsuario.ADMIN]: await jwtService.signAsync({
        sub: usuariosMap['authz.admin'].idUsuario,
        username: 'authz.admin',
        ver: 1,
      }),
      [RolUsuario.VENTAS]: await jwtService.signAsync({
        sub: usuariosMap['authz.ventas'].idUsuario,
        username: 'authz.ventas',
        ver: 1,
      }),
      [RolUsuario.COMPRAS]: await jwtService.signAsync({
        sub: usuariosMap['authz.compras'].idUsuario,
        username: 'authz.compras',
        ver: 1,
      }),
      [RolUsuario.CONSULTA]: await jwtService.signAsync({
        sub: usuariosMap['authz.consulta'].idUsuario,
        username: 'authz.consulta',
        ver: 1,
      }),
      [RolUsuario.DEMO]: await jwtService.signAsync({
        sub: usuariosMap['authz.demo'].idUsuario,
        username: 'authz.demo',
        ver: 1,
      }),
      ANONIMO: '',
      TOKEN_INVALIDO:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature123',
    };

    // 3. Crear catálogo mínimo para ventas y pedidos
    const tarifaRes = await qr.query(
      `INSERT INTO "tarifa_iva" ("codigo", "descripcion", "porcentaje", "activo")
       VALUES ('IVA_AUTHZ', 'IVA Authz 13%', 13.00, true)
       RETURNING "id_tarifa_iva"`,
    );
    const idTarifa = tarifaRes[0].id_tarifa_iva;

    const catRes = await qr.query(
      `INSERT INTO "categoria" ("nombre", "descripcion", "activo")
       VALUES ('Categoria Authz Test', 'Categoria de prueba para tests de autorizacion', true)
       RETURNING "id_categoria"`,
    );
    const idCat = catRes[0].id_categoria;

    const prodRes = await qr.query(
      `INSERT INTO "producto" (
         "nombre", "descripcion", "sku", "precio_venta_sugerido_sin_iva",
         "stock_minimo", "activo", "id_categoria", "id_tarifa_iva"
       ) VALUES ('Casco Authz Test', 'Casco de prueba', 'SKU-AUTHZ-001', 25000.00, 5, true, $1, $2)
       RETURNING "id_producto"`,
      [idCat, idTarifa],
    );
    const idProd = prodRes[0].id_producto;

    const provRes = await qr.query(
      `INSERT INTO "origen_compra" ("tipo_origen", "nombre_referencia", "pais", "moneda_preferida", "estado")
       VALUES ('PROVEEDOR_NACIONAL', 'Proveedor Authz S.A.', 'CR', 'CRC', 'ACTIVO')
       RETURNING "id_origen_compra"`,
    );
    const idProv = provRes[0].id_origen_compra;

    const numPedido = Math.floor(Math.random() * 900000) + 100000;
    const pedRes = await qr.query(
      `INSERT INTO "pedido_compra" (
         "numero_pedido", "nombre_pedido", "id_origen_compra", "fecha_pedido",
         "estado", "inversion_total", "costo_envio", "impuestos_importacion",
         "pais_compra", "moneda_compra", "tipo_cambio", "subtotal_productos",
         "envio_interno", "envio_casillero", "otros_gastos", "metodo_reparto_gastos"
       ) VALUES ($1, 'Pedido Authz Test', $2, CURRENT_DATE, 'RECIBIDO', 50000.00, 0, 0, 'CR', 'CRC', 1.0, 50000.00, 0, 0, 0, 'VALOR')
       RETURNING "id_pedido"`,
      [numPedido, idProv],
    );
    const idPed = pedRes[0].id_pedido;

    const codLote = `AZ-${Math.floor(Math.random() * 9000) + 1000}`;
    const loteRes = await qr.query(
      `INSERT INTO "lote_producto" (
         "id_pedido", "id_producto", "codigo_lote", "cantidad_inicial",
         "cantidad_recibida", "cantidad_disponible", "costo_unitario_real",
         "precio_venta_recomendado", "estado_lote", "tipo_lote", "costo_pendiente_al_vender"
       ) VALUES ($1, $2, $3, 100, 100, 20, 15000.00, 25000.00, 'DISPONIBLE', 'COMPRA_LOCAL', 0.0)
       RETURNING "id_lote"`,
      [idPed, idProd, codLote],
    );
    const idLote = loteRes[0].id_lote;

    // Crear ventas con detalle para pruebas de pago y anulación independiente
    async function crearVentaConDetalle(): Promise<number> {
      const numVenta = Math.floor(Math.random() * 900000) + 100000;
      const ventaRes = await qr.query(
        `INSERT INTO "venta" (
           "numero_venta", "fecha_venta", "cliente_nombre", "medio_pago",
           "estado_pago", "estado_venta", "subtotal", "descuento_total",
           "iva_total", "total_venta", "monto_pagado", "saldo_pendiente",
           "costo_total", "ganancia_bruta", "margen_bruto", "en_papelera"
         ) VALUES (
           $1, CURRENT_DATE, 'Cliente Venta Authz', 'EFECTIVO',
           'PENDIENTE', 'COMPLETADA', 25000.00, 0.00,
           3250.00, 28250.00, 0.00, 28250.00,
           15000.00, 10000.00, 40.00, false
         )
         RETURNING "id_venta"`,
        [numVenta],
      );
      const vId = ventaRes[0].id_venta;

      await qr.query(
        `INSERT INTO "detalle_venta" (
           "id_venta", "id_producto", "id_lote", "cantidad", "precio_unitario",
           "subtotal", "descuento", "base_imponible", "tipo_tarifa", "id_tarifa_iva",
           "porcentaje_iva", "iva", "total_linea", "costo_unitario_real", "costo_total",
           "ganancia_bruta", "modo_descuento_lote"
         ) VALUES (
           $1, $2, $3, 1, 25000.00,
           25000.00, 0.00, 25000.00, 'GENERAL', $4,
           13.00, 3250.00, 28250.00, 15000.00, 15000.00,
           10000.00, 'MONTO_FIJO'
         )`,
        [vId, idProd, idLote, idTarifa],
      );

      return vId;
    }

    const idVenta = await crearVentaConDetalle();
    const idVentaAdmin = await crearVentaConDetalle();
    const idVentaVentas = await crearVentaConDetalle();

    return {
      tokens,
      usuarios: usuariosMap,
      ventaId: idVenta,
      ventaIdAdmin: idVentaAdmin,
      ventaIdVentas: idVentaVentas,
      pedidoId: idPed,
      productoId: idProd,
      loteId: idLote,
    };
  } finally {
    await qr.release();
  }
}
