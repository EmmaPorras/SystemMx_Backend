/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { RolUsuario } from '../src/modules/usuarios/rol-usuario.enum';
import {
  categoriaE2ePayload,
  pagoVentaE2ePayload,
  pedidoE2ePayload,
  proveedorE2ePayload,
  recepcionE2ePayload,
  tarifaE2ePayload,
  usuarioE2ePayload,
  ventaE2ePayload,
} from './fixtures/systemmx-e2e.fixture';

function tomorrowIso(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

describe('SystemMx Backend v1 — Smoke / E2E Installation Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let comprasToken: string;
  let comprasId: number;
  let operadorToken: string;
  let consultaToken: string;
  let operadorId: number;

  let proveedorId: number;
  let categoriaId: number;
  let tarifaId: number;

  let pedidoId: number;
  let productoId: number;
  let loteId: number;
  let ventaId: number;

  beforeAll(async () => {
    const database = process.env.DB_DATABASE;
    if (!database?.endsWith('_e2e')) {
      throw new Error(
        `E2E rechazado para DB_DATABASE=${database}. Debe terminar en _e2e.`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, app.get(ConfigService));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Escenario 1 — Verificación de Schema Inicial e Instalación', () => {
    it('comprueba que las migraciones oficiales se ejecutaron', async () => {
      const rows = await dataSource.query(
        'SELECT COUNT(*) as cantidad FROM dbo.migrations',
      );
      expect(Number(rows[0].cantidad)).toBeGreaterThanOrEqual(1);
    });

    it('comprueba la existencia de las tablas de negocio (12 comerciales + tokens)', async () => {
      const rows = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND TABLE_NAME <> 'migrations'
      `);
      expect(Number(rows[0].cantidad)).toBe(13);
    });
  });

  describe('Escenario 2 — Bootstrap y Autenticación Inicial', () => {
    it('inicia sesión con el usuario ADMIN creado por el bootstrap', async () => {
      const username = process.env.SYSTEMMX_BOOTSTRAP_USERNAME ?? 'admin';
      const password =
        process.env.SYSTEMMX_BOOTSTRAP_PASSWORD ?? 'AdminPassword123!';

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username, password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.usuario.rol).toBe(RolUsuario.ADMIN);
      adminToken = res.body.accessToken as string;
    });

    it('permite consultar /api/auth/me con token de ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.rol).toBe(RolUsuario.ADMIN);
    });

    it('rechaza con 401 peticiones sin token', async () => {
      await request(app.getHttpServer()).get('/api/productos').expect(401);
    });
  });

  describe('Escenario 3 — Creación y Login de Usuarios de Prueba', () => {
    it('ADMIN crea usuario COMPRAS', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioE2ePayload('e2e_compras', RolUsuario.COMPRAS))
        .expect(201);

      expect(res.body.rol).toBe(RolUsuario.COMPRAS);
      comprasId = Number(res.body.idUsuario);
    });

    it('inicia sesión con COMPRAS', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e_compras', password: 'PasswordE2E123!' })
        .expect(200);

      comprasToken = res.body.accessToken as string;
    });

    it('ADMIN crea usuario VENTAS', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioE2ePayload('e2e_ventas', RolUsuario.VENTAS))
        .expect(201);

      expect(res.body.rol).toBe(RolUsuario.VENTAS);
      operadorId = Number(res.body.idUsuario);
    });

    it('ADMIN crea usuario CONSULTA', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioE2ePayload('e2e_consulta', RolUsuario.CONSULTA))
        .expect(201);

      expect(res.body.rol).toBe(RolUsuario.CONSULTA);
    });

    it('inicia sesión con VENTAS', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e_ventas', password: 'PasswordE2E123!' })
        .expect(200);

      operadorToken = res.body.accessToken as string;
    });

    it('inicia sesión con CONSULTA', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e_consulta', password: 'PasswordE2E123!' })
        .expect(200);

      consultaToken = res.body.accessToken as string;
    });
  });

  describe('Escenario 4 — Matriz de Seguridad y Roles', () => {
    it('CONSULTA puede leer /api/productos', async () => {
      await request(app.getHttpServer())
        .get('/api/productos')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);
    });

    it('CONSULTA no puede crear proveedores (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${consultaToken}`)
        .send(proveedorE2ePayload())
        .expect(403);
    });

    it('VENTAS no puede crear proveedores (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${operadorToken}`)
        .send(proveedorE2ePayload())
        .expect(403);
    });

    it('CONSULTA y VENTAS no pueden ver auditoría (403)', async () => {
      await request(app.getHttpServer())
        .get('/api/reportes/auditoria/resumen')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/reportes/auditoria/resumen')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(403);
    });

    it('ADMIN puede acceder a auditoría (200)', async () => {
      await request(app.getHttpServer())
        .get('/api/reportes/auditoria/resumen')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Escenario 5 — Configuración Administrativa Mínima', () => {
    it('ADMIN crea proveedor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(proveedorE2ePayload())
        .expect(201);

      proveedorId = Number(
        res.body.idOrigenCompra ?? res.body.idProveedor ?? res.body.id,
      );
      expect(proveedorId).toBeGreaterThan(0);
    });

    it('ADMIN crea categoría', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoriaE2ePayload())
        .expect(201);

      categoriaId = Number(res.body.idCategoria ?? res.body.id);
      expect(categoriaId).toBeGreaterThan(0);
    });

    it('ADMIN crea tarifa IVA', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tarifas-iva')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tarifaE2ePayload())
        .expect(201);

      tarifaId = Number(res.body.idTarifaIva ?? res.body.id);
      expect(tarifaId).toBeGreaterThan(0);
    });

    it('comprueba que existe catálogo de OrigenCompra reproducible', async () => {
      const origenes = await dataSource.query(`
        SELECT TOP 1 id_origen_compra
        FROM dbo.origen_compra
        WHERE estado = 'ACTIVO'
        ORDER BY id_origen_compra
      `);

      if (origenes.length === 0) {
        throw new Error(
          'No existe OrigenCompra estructural después de migration:run.',
        );
      }
      expect(origenes[0].id_origen_compra).toBeDefined();
    });
  });

  describe('Escenario 6 — Creación de Pedido y Nacimiento de Producto', () => {
    it('COMPRAS registra Pedido (cantidad = 5)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/pedidos')
        .set('Authorization', `Bearer ${comprasToken}`)
        .send(pedidoE2ePayload(proveedorId, categoriaId))
        .expect(201);

      pedidoId = Number(res.body.id ?? res.body.idPedido);
      expect(pedidoId).toBeGreaterThan(0);
    });

    it('el Producto nace exclusivamente por el Pedido', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/productos')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const productos = res.body as Array<{
        idProducto: number;
        nombre: string;
      }>;
      const found = productos.filter((p) => p.nombre === 'Producto E2E');
      expect(found).toHaveLength(1);
      productoId = Number(found[0].idProducto);
    });

    it('el lote inicial queda en estado EN_PROCESO con stock 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventario/lotes')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const lotes = res.body.items as Array<{
        idLote: number;
        idProducto: number;
        cantidadRecibida: number;
        cantidadDisponible: number;
        estadoLote: string;
      }>;
      const found = lotes.filter((l) => l.idProducto === productoId);
      expect(found).toHaveLength(1);
      expect(Number(found[0].cantidadRecibida)).toBe(0);
      expect(Number(found[0].cantidadDisponible)).toBe(0);
      expect(found[0].estadoLote).toBe('EN_PROCESO');
      loteId = Number(found[0].idLote);
    });
  });

  describe('Escenario 7 — Recepción de Pedido e Ingreso al Inventario', () => {
    it('COMPRAS recibe el pedido completamente (+5)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/pedidos/${pedidoId}/recepcion`)
        .set('Authorization', `Bearer ${comprasToken}`)
        .send(recepcionE2ePayload(loteId, 5))
        .expect(200);

      expect(res.body.estado).toBe('RECIBIDO');
    });

    it('el lote actualiza cantidadRecibida = 5 y cantidadDisponible = 5', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventario/lotes/${loteId}`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      expect(Number(res.body.cantidadRecibida)).toBe(5);
      expect(Number(res.body.cantidadDisponible)).toBe(5);
    });

    it('se registra movimiento ENTRADA_COMPRA con snapshot de usuario operador', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const movimientos = res.body.items as Array<{
        tipoMovimiento: string;
        cantidad: number;
        idLote?: number;
        lote?: { idLote: number };
        idUsuario?: number;
        usuario?: string;
      }>;
      const entrada = movimientos.find(
        (m) =>
          (m.idLote === loteId || m.lote?.idLote === loteId) &&
          m.tipoMovimiento === 'ENTRADA_COMPRA',
      );
      expect(entrada).toBeDefined();
      expect(Number(entrada?.cantidad)).toBe(5);
      expect(entrada?.idUsuario).toBe(comprasId);
      expect(entrada?.usuario).toBe('e2e_compras');
    });
  });

  describe('Escenario 8 — Venta y Salida de Inventario', () => {
    it('verifica 5 unidades disponibles antes de vender', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ventas/inventario-disponible')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const disponibles = res.body as Array<{
        productoId?: number;
        idProducto?: number;
        cantidadDisponible?: number;
        disponibleTotal?: number;
      }>;
      const item = disponibles.find(
        (p) => (p.productoId ?? p.idProducto) === productoId,
      );
      expect(item).toBeDefined();
      expect(Number(item?.cantidadDisponible ?? item?.disponibleTotal)).toBe(5);
    });

    it('VENTAS vende 2 unidades dejando saldo pendiente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ventas')
        .set('Authorization', `Bearer ${operadorToken}`)
        .send(ventaE2ePayload(productoId))
        .expect(201);

      ventaId = Number(res.body.id ?? res.body.idVenta);
      expect(ventaId).toBeGreaterThan(0);
      expect(Number(res.body.saldoPendiente)).toBeGreaterThan(0);
    });

    it('el stock disponible disminuye a 3 unidades (5 - 2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventario/lotes/${loteId}`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      expect(Number(res.body.cantidadDisponible)).toBe(3);
    });

    it('se registra movimiento SALIDA_VENTA de 2 unidades', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const movimientos = res.body.items as Array<{
        tipoMovimiento: string;
        cantidad: number;
        idLote?: number;
        lote?: { idLote: number };
      }>;
      const salida = movimientos.find(
        (m) =>
          (m.idLote === loteId || m.lote?.idLote === loteId) &&
          m.tipoMovimiento === 'SALIDA_VENTA',
      );
      expect(salida).toBeDefined();
      expect(Number(salida?.cantidad)).toBe(2);
    });

    it('la venta conserva detalle de costos históricos reales', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/ventas/${ventaId}`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      expect(res.body.detalles).toHaveLength(1);
      const det = res.body.detalles[0] as {
        idLote?: number;
        loteId?: number;
        costoUnitarioReal: number;
        costoTotal: number;
        gananciaBruta: number;
      };
      expect(det.idLote ?? det.loteId).toBe(loteId);
      expect(det.costoUnitarioReal).toBeDefined();
      expect(det.costoTotal).toBeDefined();
      expect(det.gananciaBruta).toBeDefined();
    });
  });

  describe('Escenario 9 — Cuentas por Cobrar', () => {
    it('la venta con saldo pendiente aparece en cuentas por cobrar', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/cuentas-por-cobrar')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const cxc = res.body.detalle as Array<{ idVenta: number }>;
      expect(cxc.some((v) => v.idVenta === ventaId)).toBe(true);
    });
  });

  describe('Escenario 10 — Pago y Conciliación Financiera', () => {
    it('VENTAS registra abono para cancelar el saldo restante', async () => {
      await request(app.getHttpServer())
        .post(`/api/ventas/${ventaId}/pagos`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .send(pagoVentaE2ePayload(2000))
        .expect(201);
    });

    it('el ledger append-only registra los pagos con snapshot de usuario', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/ventas/${ventaId}/pagos`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const pagos = res.body as Array<{
        monto: number;
        idUsuario: number;
        usuario: string;
      }>;
      expect(pagos.length).toBeGreaterThanOrEqual(1);
      const ultimoPago = pagos[pagos.length - 1];
      expect(Number(ultimoPago.monto)).toBe(2000);
      expect(ultimoPago.idUsuario).toBe(operadorId);
      expect(ultimoPago.usuario).toBe('e2e_ventas');
    });

    it('la venta queda CONCILIADA con diferencia 0 en conciliación', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/pagos/conciliacion')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      const items = res.body.detalle as Array<{
        idVenta: number;
        estado: string;
        diferencia: number;
      }>;
      const conc = items.find((i) => i.idVenta === ventaId);
      expect(conc).toBeDefined();
      expect(conc?.estado).toBe('CONCILIADA');
      expect(Number(conc?.diferencia)).toBe(0);
    });
  });

  describe('Escenario 11 — Reportes Reconciliados antes de Anular', () => {
    it('reconciliación de reportes de inventario (stock = 3)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/inventario/resumen')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      expect(Number(res.body.unidadesDisponibles)).toBe(3);
    });

    it('reconciliación de pagos en resumen y métodos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/pagos/resumen')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      expect(Number(res.body.montoRegistrado)).toBe(4000);
    });
  });

  describe('Escenario 12 — Inventario Histórico Moderno', () => {
    it('el lote moderno tiene historialCompleto = true y 0 legacy', async () => {
      const fechaCorte = tomorrowIso();
      const res = await request(app.getHttpServer())
        .get(`/api/reportes/inventario/historico?fechaCorte=${fechaCorte}`)
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      const lotes = res.body.lotes as Array<{
        idLote: number;
        stockHistorico: number;
        stockActual: number;
        consistente: boolean;
        historialCompleto: boolean;
      }>;
      const loteReport = lotes.find((l) => l.idLote === loteId);
      expect(loteReport).toBeDefined();
      expect(Number(loteReport?.stockHistorico)).toBe(3);
      expect(Number(loteReport?.stockActual)).toBe(3);
      expect(loteReport?.consistente).toBe(true);
      expect(loteReport?.historialCompleto).toBe(true);

      expect(Number(res.body.cobertura.lotesLegacy)).toBe(0);
      expect(res.body.cobertura.coberturaCompleta).toBe(true);
    });
  });

  describe('Escenario 13 — Auditoría Moderna', () => {
    it('auditoría general muestra 0 movimientos y 0 pagos legacy', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/auditoria/resumen')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Number(res.body.movimientos.legacy)).toBe(0);
      expect(Number(res.body.pagos.legacy)).toBe(0);
    });

    it('actividad por usuario atribuye operaciones al operador', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reportes/auditoria/usuarios?usuarioId=${operadorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const usuarios = res.body as Array<{
        idUsuario: number;
        movimientos: number;
        pagosProcesados: number;
      }>;
      const op = usuarios.find((u) => u.idUsuario === operadorId);
      expect(op).toBeDefined();
      expect(
        Number(op?.movimientos) + Number(op?.pagosProcesados),
      ).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Escenario 14 — Anulación de Venta', () => {
    it('VENTAS anula la venta', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/ventas/${ventaId}/anular`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      expect(res.body.estadoVenta).toBe('ANULADA');
    });

    it('el stock disponible se restaura a 5 unidades (3 + 2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventario/lotes/${loteId}`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      expect(Number(res.body.cantidadDisponible)).toBe(5);
    });

    it('se registra movimiento REINGRESO_ANULACION_VENTA de 2 unidades', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const movimientos = res.body.items as Array<{
        tipoMovimiento: string;
        cantidad: number;
        idLote?: number;
        lote?: { idLote: number };
      }>;
      const reingreso = movimientos.find(
        (m) =>
          (m.idLote === loteId || m.lote?.idLote === loteId) &&
          m.tipoMovimiento === 'REINGRESO_ANULACION_VENTA',
      );
      expect(reingreso).toBeDefined();
      expect(Number(reingreso?.cantidad)).toBe(2);
    });

    it('los pagos históricos se preservan y no son eliminados', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/ventas/${ventaId}/pagos`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      expect((res.body as unknown[]).length).toBeGreaterThanOrEqual(1);
    });

    it('la venta anulada sale de las ventas comerciales válidas', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/ventas/resumen')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      expect(Number(res.body.cantidadVentas)).toBe(0);
      expect(Number(res.body.ventas)).toBe(0);
    });

    it('la venta aparece en el reporte de ventas anuladas', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/ventas/anuladas')
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      expect(Number(res.body.cantidad)).toBe(1);
    });

    it('la venta anulada ya no aparece en cuentas por cobrar', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reportes/cuentas-por-cobrar')
        .set('Authorization', `Bearer ${operadorToken}`)
        .expect(200);

      const cxc = res.body.detalle as Array<{ idVenta: number }>;
      expect(cxc.some((v) => v.idVenta === ventaId)).toBe(false);
    });
  });

  describe('Escenario 15 — Inventario Histórico Posterior a la Anulación', () => {
    it('el stock histórico y actual vuelven a ser 5', async () => {
      const fechaCorte = tomorrowIso();
      const res = await request(app.getHttpServer())
        .get(`/api/reportes/inventario/historico?fechaCorte=${fechaCorte}`)
        .set('Authorization', `Bearer ${consultaToken}`)
        .expect(200);

      const lotes = res.body.lotes as Array<{
        idLote: number;
        stockHistorico: number;
        stockActual: number;
        consistente: boolean;
      }>;
      const loteReport = lotes.find((l) => l.idLote === loteId);
      expect(loteReport).toBeDefined();
      expect(Number(loteReport?.stockHistorico)).toBe(5);
      expect(Number(loteReport?.stockActual)).toBe(5);
      expect(loteReport?.consistente).toBe(true);
    });
  });

  describe('Integridad SQL Directa en BD E2E', () => {
    it('0 stock negativo en lotes', async () => {
      const [negativo] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.lote_producto
        WHERE cantidad_disponible < 0
      `);
      expect(Number(negativo.cantidad)).toBe(0);
    });

    it('0 movimientos de inventario inválidos', async () => {
      const [invalidos] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.movimiento_inventario
        WHERE cantidad <= 0
           OR costo_unitario < 0
           OR total_movimiento < 0
      `);
      expect(Number(invalidos.cantidad)).toBe(0);
    });

    it('0 pagos con monto inválido', async () => {
      const [pagos] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.pago_venta
        WHERE monto <= 0
      `);
      expect(Number(pagos.cantidad)).toBe(0);
    });

    it('0 detalles de venta huérfanos', async () => {
      const [huerfanos] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.detalle_venta dv
        LEFT JOIN dbo.venta v ON v.id_venta = dv.id_venta
        WHERE v.id_venta IS NULL
      `);
      expect(Number(huerfanos.cantidad)).toBe(0);
    });

    it('0 pagos huérfanos', async () => {
      const [huerfanos] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.pago_venta p
        LEFT JOIN dbo.venta v ON v.id_venta = p.id_venta
        WHERE v.id_venta IS NULL
      `);
      expect(Number(huerfanos.cantidad)).toBe(0);
    });

    it('0 movimientos o pagos sin usuario (legacy = 0 en BD nueva)', async () => {
      const [movLegacy] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.movimiento_inventario
        WHERE id_usuario IS NULL
      `);
      expect(Number(movLegacy.cantidad)).toBe(0);

      const [pagoLegacy] = await dataSource.query(`
        SELECT COUNT(*) as cantidad
        FROM dbo.pago_venta
        WHERE id_usuario IS NULL
      `);
      expect(Number(pagoLegacy.cantidad)).toBe(0);
    });
  });
});
