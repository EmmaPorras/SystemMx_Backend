/**
 * ============================================================================
 * SUITE DE PRUEBAS DE AUTORIZACIÓN Y CONTROL DE ACCESO (Ítem 4.5 — SSDLC)
 * ============================================================================
 * Ejecuta comprobaciones de seguridad directamente contra la API HTTP utilizando
 * Supertest sobre una base de datos efímera aislada, evaluando:
 * 1. Matriz de permisos rol x endpoint x resultado esperado (F1, F2, F3).
 * 2. Comprobación estricta de NO-MODIFICACIÓN de datos ante accesos denegados.
 * 3. Regla del último ADMIN activo (HTTP 409 Conflict).
 * 4. Invalidación de tokens tras revocación/cambio de contraseña (HTTP 401).
 * 5. Intento de escalada o auto-elevación de privilegios (HTTP 403).
 * 6. Aislamiento y denegación de escritura para el rol DEMO.
 * ============================================================================
 */

import request from 'supertest';
import { RolUsuario } from '../../src/modules/usuarios/rol-usuario.enum';
import {
  AuthzTestContext,
  cleanupAuthzTestData,
  createAuthzTestContext,
} from './authz-test-helpers';
import { AuthzActor, MATRIZ_PERMISOS } from './matriz-permisos';

describe('Ítem 4.5 — Pruebas de Autorización y Control de Acceso (SystemMx)', () => {
  let ctx: AuthzTestContext;

  beforeAll(async () => {
    ctx = await createAuthzTestContext();
  }, 45000);

  afterAll(async () => {
    if (ctx?.dataSource) {
      await cleanupAuthzTestData(ctx.dataSource);
    }
    if (ctx?.app) {
      await ctx.app.close();
    }
  });

  // ==========================================================================
  // BLOQUE 1: EJECUCIÓN BASADA EN DATOS (Data-Driven Matrix Runner)
  // ==========================================================================
  describe('Matriz de Permisos por Endpoint y Rol (F1, F2, F3 y Complementarios)', () => {
    const actores: AuthzActor[] = [
      RolUsuario.ADMIN,
      RolUsuario.VENTAS,
      RolUsuario.COMPRAS,
      RolUsuario.CONSULTA,
      RolUsuario.DEMO,
      'ANONIMO',
      'TOKEN_INVALIDO',
    ];

    for (const def of MATRIZ_PERMISOS) {
      describe(`${def.id} — ${def.descripcion}`, () => {
        for (const actor of actores) {
          const expected = def.permisos[actor];

          it(`${actor} debe recibir HTTP ${expected.statusEsperado} (${expected.permitido ? 'Permitido' : 'Denegado'})`, async () => {
            const url = def.construirRuta({
              usuarioId: ctx.usuarios['authz.target'].idUsuario,
              ventaId: ctx.ventaId,
              pedidoId: ctx.pedidoId,
            });

            const req = (request(ctx.app.getHttpServer()) as any)[
              def.metodo.toLowerCase()
            ](url);

            // Inyectar cabecera Authorization según el actor
            if (actor === 'TOKEN_INVALIDO') {
              req.set('Authorization', ctx.tokens.TOKEN_INVALIDO);
            } else if (actor !== 'ANONIMO') {
              req.set('Authorization', `Bearer ${ctx.tokens[actor]}`);
            }

            if (def.construirBody) {
              req.send(
                def.construirBody({
                  usuarioId: ctx.usuarios['authz.target'].idUsuario,
                  ventaId: ctx.ventaId,
                }),
              );
            }

            const res = await req;
            expect(res.status).toBe(expected.statusEsperado);
          });
        }
      });
    }
  });

  // ==========================================================================
  // BLOQUE 2: CASOS DE DOMINIO Y VERIFICACIÓN DE NO-MODIFICACIÓN
  // ==========================================================================
  describe('Escenarios Críticos de Dominio y Verificación de No-Modificación', () => {
    // ------------------------------------------------------------------------
    // CASO 1: REGLA DE PROTECCIÓN DEL ÚLTIMO ADMIN ACTIVO (F3-AC2)
    // ------------------------------------------------------------------------
    describe('F3-AC2: Protección del Último Administrador Activo', () => {
      it('permite desactivar un administrador cuando existe más de uno activo', async () => {
        const idAdmin2 = ctx.usuarios['authz.admin2'].idUsuario;

        const res = await request(ctx.app.getHttpServer())
          .patch(`/api/usuarios/${idAdmin2}/estado`)
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.ADMIN]}`)
          .send({ activo: false });

        expect(res.status).toBe(200);
        expect(res.body.activo).toBe(false);
      });

      it('rechaza con HTTP 409 Conflict desactivar al último administrador activo y no modifica su estado', async () => {
        const idUltimoAdmin = ctx.usuarios['authz.admin'].idUsuario;

        // Intentar desactivar al último administrador
        const res = await request(ctx.app.getHttpServer())
          .patch(`/api/usuarios/${idUltimoAdmin}/estado`)
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.ADMIN]}`)
          .send({ activo: false });

        expect(res.status).toBe(409);
        expect(res.body.message).toContain('último administrador');

        // Verificación en BD: el usuario DEBE seguir activo
        const rows = await ctx.dataSource.query(
          `SELECT "activo", "rol" FROM "usuario" WHERE "id_usuario" = $1`,
          [idUltimoAdmin],
        );
        expect(rows[0].activo).toBe(true);
        expect(rows[0].rol).toBe(RolUsuario.ADMIN);
      });

      it('rechaza con HTTP 409 Conflict degradar el rol del último administrador activo', async () => {
        const idUltimoAdmin = ctx.usuarios['authz.admin'].idUsuario;

        // Intentar degradar a VENTAS
        const res = await request(ctx.app.getHttpServer())
          .patch(`/api/usuarios/${idUltimoAdmin}/rol`)
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.ADMIN]}`)
          .send({ rol: RolUsuario.VENTAS });

        expect(res.status).toBe(409);
        expect(res.body.message).toContain('último administrador');

        // Verificación en BD: el rol DEBE seguir siendo ADMIN
        const rows = await ctx.dataSource.query(
          `SELECT "rol" FROM "usuario" WHERE "id_usuario" = $1`,
          [idUltimoAdmin],
        );
        expect(rows[0].rol).toBe(RolUsuario.ADMIN);
      });
    });

    // ------------------------------------------------------------------------
    // CASO 2: INVALIDACIÓN DE TOKENS POR CAMBIO DE CREDENCIALES (F1-AC4 / F3-AC5)
    // ------------------------------------------------------------------------
    describe('F1-AC4 / F3-AC5: Invalidación de Token tras Cambio de Contraseña', () => {
      it('invalida inmediatamente el JWT emitido previamente tras un cambio de contraseña', async () => {
        const targetId = ctx.usuarios['authz.target'].idUsuario;

        // 1. Emitir token válido con versión de credenciales actual (ver = 1)
        const tokenOriginal = await ctx.jwtService.signAsync({
          sub: targetId,
          username: 'authz.target',
          ver: 1,
        });

        // 2. Comprobar que el token original funciona en /api/auth/me
        const resPre = await request(ctx.app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${tokenOriginal}`);
        expect(resPre.status).toBe(200);

        // 3. El ADMIN cambia la contraseña del usuario (incrementa versionCredenciales a 2)
        const resChange = await request(ctx.app.getHttpServer())
          .patch(`/api/usuarios/${targetId}/password`)
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.ADMIN]}`)
          .send({ password: 'PasswordRenovadoSeguro456!' });
        expect(resChange.status).toBe(200);

        // 4. Intentar usar el token original (ver = 1) tras la rotación
        const resPost = await request(ctx.app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${tokenOriginal}`);

        // Debe ser RECHAZADO con 401 Unauthorized
        expect(resPost.status).toBe(401);
      });
    });

    // ------------------------------------------------------------------------
    // CASO 3: INTENTO DE AUTO-ELEVACIÓN DE PRIVILEGIOS (F3-AC3)
    // ------------------------------------------------------------------------
    describe('F3-AC3: Prevención de Auto-Elevación de Privilegios', () => {
      it('rechaza con HTTP 403 que un usuario VENTAS intente promoverse a ADMIN y no altera el rol', async () => {
        const ventasId = ctx.usuarios['authz.ventas'].idUsuario;

        const res = await request(ctx.app.getHttpServer())
          .patch(`/api/usuarios/${ventasId}/rol`)
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.VENTAS]}`)
          .send({ rol: RolUsuario.ADMIN });

        expect(res.status).toBe(403);

        // Verificación en BD: el rol DEBE permanecer como VENTAS
        const rows = await ctx.dataSource.query(
          `SELECT "rol" FROM "usuario" WHERE "id_usuario" = $1`,
          [ventasId],
        );
        expect(rows[0].rol).toBe(RolUsuario.VENTAS);
      });
    });

    // ------------------------------------------------------------------------
    // CASO 4: NO-MODIFICACIÓN ANTE INTENTO DE ESCRITURA NO AUTORIZADA (F2-AC3)
    // ------------------------------------------------------------------------
    describe('F2-AC3: No-Modificación de Existencias ni Ventas ante Acceso Denegado', () => {
      it('rechaza con HTTP 403 que COMPRAS registre una venta y confirma que el stock no cambió', async () => {
        // 1. Obtener estado previo del stock en el lote
        const lotePre = await ctx.dataSource.query(
          `SELECT "cantidad_disponible" FROM "lote_producto" WHERE "id_lote" = $1`,
          [ctx.loteId],
        );
        const stockInicial = Number(lotePre[0].cantidad_disponible);

        const ventasCountPre = await ctx.dataSource.query(
          `SELECT COUNT(*) as count FROM "venta"`,
        );
        const totalVentasInicial = Number(ventasCountPre[0].count);

        // 2. El usuario COMPRAS intenta forzar una venta directa
        const res = await request(ctx.app.getHttpServer())
          .post('/api/ventas')
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.COMPRAS]}`)
          .send({
            clienteNombre: 'Cliente Intruso Compras',
            tipoVenta: 'CONTADO',
            lineas: [
              {
                idProducto: ctx.productoId,
                idLote: ctx.loteId,
                cantidad: 5,
                precioUnitario: 25000,
              },
            ],
          });

        expect(res.status).toBe(403);

        // 3. Comprobar que no se creó ninguna venta ni se descontó inventario
        const lotePost = await ctx.dataSource.query(
          `SELECT "cantidad_disponible" FROM "lote_producto" WHERE "id_lote" = $1`,
          [ctx.loteId],
        );
        expect(Number(lotePost[0].cantidad_disponible)).toBe(stockInicial);

        const ventasCountPost = await ctx.dataSource.query(
          `SELECT COUNT(*) as count FROM "venta"`,
        );
        expect(Number(ventasCountPost[0].count)).toBe(totalVentasInicial);
      });
    });

    // ------------------------------------------------------------------------
    // CASO 5: ROL DEMO SIN PRIVILEGIOS DE ESCRITURA
    // ------------------------------------------------------------------------
    describe('Rol DEMO: Aislamiento y Denegación Estricta de Escritura', () => {
      it('permite al rol DEMO consultar únicamente el resumen aislado', async () => {
        const res = await request(ctx.app.getHttpServer())
          .get('/api/demo/resumen')
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.DEMO]}`);

        expect(res.status).toBe(200);
        expect(res.body.modo).toBe('DEMOSTRACION_EVALUATIVA');
      });

      it('rechaza con HTTP 403 cualquier intento de mutación del rol DEMO en ventas', async () => {
        const res = await request(ctx.app.getHttpServer())
          .post('/api/ventas')
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.DEMO]}`)
          .send({ clienteNombre: 'Demo Atacante' });

        expect(res.status).toBe(403);
      });

      it('rechaza con HTTP 403 cualquier intento de mutación del rol DEMO en usuarios', async () => {
        const res = await request(ctx.app.getHttpServer())
          .post('/api/usuarios')
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.DEMO]}`)
          .send({ username: 'demo.creador' });

        expect(res.status).toBe(403);
      });

      it('rechaza con HTTP 403 cualquier intento de mutación del rol DEMO en pedidos', async () => {
        const res = await request(ctx.app.getHttpServer())
          .post('/api/pedidos')
          .set('Authorization', `Bearer ${ctx.tokens[RolUsuario.DEMO]}`)
          .send({ nombrePedido: 'Pedido Demo' });

        expect(res.status).toBe(403);
      });
    });
  });
});
