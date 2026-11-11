/**
 * ============================================================================
 * MATRIZ DE AUTORIZACIÓN Y CONTROL DE ACCESO (Ítem 4.5 — SSDLC)
 * ============================================================================
 * Fuente de verdad: docs/conocimiento/arquitectura-y-permisos.md (Sección 62)
 * y flujos críticos F1, F2, F3 documentados en docs/conocimiento/flujos.md.
 *
 * Modelo de roles del código fuente:
 * - ADMIN: Acceso total a administración, ventas, compras, inventario, catálogos y reportes.
 * - VENTAS: Operaciones comerciales de ventas, cobros, anulación y consulta de inventario/catálogos.
 * - COMPRAS: Operaciones de compras, pedidos, recepciones y consulta de proveedores/catálogos.
 * - CONSULTA: Solo lectura en catálogos, productos, inventario y reportes generales (sin mutaciones).
 * - DEMO: Aislamiento evaluativo; únicamente lectura simulada en /api/demo/resumen. Sin escritura.
 * - ANONIMO: Sin cabecera Authorization (HTTP 401).
 * - TOKEN_INVALIDO: Token malformado, vencido o con firma inválida (HTTP 401).
 * ============================================================================
 */

import { RolUsuario } from '../../src/modules/usuarios/rol-usuario.enum';

export type AuthzActor = RolUsuario | 'ANONIMO' | 'TOKEN_INVALIDO';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface PermisoEndpointDef {
  id: string;
  flujo: 'F1' | 'F2' | 'F3' | 'COMPLEMENTARIO';
  descripcion: string;
  metodo: HttpMethod;
  construirRuta: (
    ctx: {
      usuarioId: number;
      ventaId: number;
      ventaIdAdmin?: number;
      ventaIdVentas?: number;
      pedidoId: number;
    },
    actor?: AuthzActor,
  ) => string;
  construirBody?: (ctx: {
    usuarioId: number;
    ventaId: number;
  }) => Record<string, unknown>;
  esMutacion: boolean;
  permisos: Record<
    AuthzActor,
    {
      statusEsperado: number;
      permitido: boolean;
    }
  >;
}

export const MATRIZ_PERMISOS: PermisoEndpointDef[] = [
  // --------------------------------------------------------------------------
  // FLUJO F1: AUTENTICACIÓN Y SESIÓN
  // --------------------------------------------------------------------------
  {
    id: 'F1-ME',
    flujo: 'F1',
    descripcion: 'Consultar identidad de sesión activa (GET /api/auth/me)',
    metodo: 'GET',
    construirRuta: () => '/api/auth/me',
    esMutacion: false,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 200, permitido: true },
      [RolUsuario.COMPRAS]: { statusEsperado: 200, permitido: true },
      [RolUsuario.CONSULTA]: { statusEsperado: 200, permitido: true },
      [RolUsuario.DEMO]: { statusEsperado: 200, permitido: true },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },

  // --------------------------------------------------------------------------
  // FLUJO F2: VENTAS, PAGOS Y ANULACIONES
  // --------------------------------------------------------------------------
  {
    id: 'F2-VENTAS-LISTAR',
    flujo: 'F2',
    descripcion: 'Listar ventas comerciales (GET /api/ventas)',
    metodo: 'GET',
    construirRuta: () => '/api/ventas',
    esMutacion: false,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 200, permitido: true },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F2-VENTAS-CREAR',
    flujo: 'F2',
    descripcion: 'Crear nueva venta comercial (POST /api/ventas)',
    metodo: 'POST',
    construirRuta: () => '/api/ventas',
    construirBody: () => ({
      clienteNombre: 'Cliente Prueba Authz',
      formaPago: 'EFECTIVO',
      lineas: [],
    }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 400, permitido: true }, // Permiso concedido por guard (falla solo por validación DTO de líneas)
      [RolUsuario.VENTAS]: { statusEsperado: 400, permitido: true }, // Permiso concedido por guard (falla solo por validación DTO de líneas)
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F2-PAGOS-REGISTRAR',
    flujo: 'F2',
    descripcion: 'Registrar abono/pago de venta (POST /api/ventas/:id/pagos)',
    metodo: 'POST',
    construirRuta: (ctx) => `/api/ventas/${ctx.ventaId}/pagos`,
    construirBody: () => ({
      monto: 5000,
      metodoPago: 'EFECTIVO',
    }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 201, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 201, permitido: true },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F2-VENTAS-ANULAR',
    flujo: 'F2',
    descripcion: 'Anular venta con reversión (PATCH /api/ventas/:id/anular)',
    metodo: 'PATCH',
    construirRuta: (ctx, actor) => {
      const vId =
        actor === RolUsuario.VENTAS
          ? (ctx.ventaIdVentas ?? ctx.ventaId)
          : (ctx.ventaIdAdmin ?? ctx.ventaId);
      return `/api/ventas/${vId}/anular`;
    },
    construirBody: () => ({ motivo: 'Anulación de prueba de seguridad' }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 200, permitido: true },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },

  // --------------------------------------------------------------------------
  // FLUJO F3: ADMINISTRACIÓN DE USUARIOS Y ROLES (Solo ADMIN)
  // --------------------------------------------------------------------------
  {
    id: 'F3-USUARIOS-LISTAR',
    flujo: 'F3',
    descripcion: 'Listar usuarios registrados (GET /api/usuarios)',
    metodo: 'GET',
    construirRuta: () => '/api/usuarios',
    esMutacion: false,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F3-USUARIOS-DETALLE',
    flujo: 'F3',
    descripcion: 'Consultar detalle de usuario (GET /api/usuarios/:id)',
    metodo: 'GET',
    construirRuta: (ctx) => `/api/usuarios/${ctx.usuarioId}`,
    esMutacion: false,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F3-USUARIOS-CREAR',
    flujo: 'F3',
    descripcion: 'Crear nuevo usuario en el sistema (POST /api/usuarios)',
    metodo: 'POST',
    construirRuta: () => '/api/usuarios',
    construirBody: () => ({
      username: 'usuario.intruso',
      nombre: 'Usuario Intruso Test',
      password: 'IntrusoPassword123!',
      rol: RolUsuario.VENTAS,
    }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 201, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F3-USUARIOS-ROL',
    flujo: 'F3',
    descripcion: 'Modificar rol de usuario (PATCH /api/usuarios/:id/rol)',
    metodo: 'PATCH',
    construirRuta: (ctx) => `/api/usuarios/${ctx.usuarioId}/rol`,
    construirBody: () => ({ rol: RolUsuario.ADMIN }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F3-USUARIOS-ESTADO',
    flujo: 'F3',
    descripcion:
      'Activar o desactivar usuario (PATCH /api/usuarios/:id/estado)',
    metodo: 'PATCH',
    construirRuta: (ctx) => `/api/usuarios/${ctx.usuarioId}/estado`,
    construirBody: () => ({ activo: false }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'F3-USUARIOS-PASSWORD',
    flujo: 'F3',
    descripcion:
      'Restablecer contraseña de usuario (PATCH /api/usuarios/:id/password)',
    metodo: 'PATCH',
    construirRuta: (ctx) => `/api/usuarios/${ctx.usuarioId}/password`,
    construirBody: () => ({ password: 'NuevaClaveSegura123!' }),
    esMutacion: true,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },

  // --------------------------------------------------------------------------
  // RUTAS COMPLEMENTARIAS: PEDIDOS Y DEMO
  // --------------------------------------------------------------------------
  {
    id: 'COMP-PEDIDOS-LISTAR',
    flujo: 'COMPLEMENTARIO',
    descripcion: 'Listar pedidos de compra (GET /api/pedidos)',
    metodo: 'GET',
    construirRuta: () => '/api/pedidos',
    esMutacion: false,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.COMPRAS]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      [RolUsuario.DEMO]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
  {
    id: 'COMP-DEMO-RESUMEN',
    flujo: 'COMPLEMENTARIO',
    descripcion: 'Consultar dataset simulado aislado (GET /api/demo/resumen)',
    metodo: 'GET',
    construirRuta: () => '/api/demo/resumen',
    esMutacion: false,
    permisos: {
      [RolUsuario.ADMIN]: { statusEsperado: 200, permitido: true },
      [RolUsuario.DEMO]: { statusEsperado: 200, permitido: true },
      [RolUsuario.VENTAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.COMPRAS]: { statusEsperado: 403, permitido: false },
      [RolUsuario.CONSULTA]: { statusEsperado: 403, permitido: false },
      ANONIMO: { statusEsperado: 401, permitido: false },
      TOKEN_INVALIDO: { statusEsperado: 401, permitido: false },
    },
  },
];
