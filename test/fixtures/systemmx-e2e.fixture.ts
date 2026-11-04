import { RolUsuario } from '../../src/modules/usuarios/rol-usuario.enum';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function usuarioE2ePayload(
  username: string,
  rol: RolUsuario,
  overrides = {},
) {
  return {
    username,
    nombre: `Usuario ${username}`,
    password: 'PasswordE2E123!',
    rol,
    ...overrides,
  };
}

export function proveedorE2ePayload(overrides = {}) {
  return {
    tipoOrigen: 'Proveedor',
    nombreReferencia: 'E2E-PROV-001',
    telefono: '+506 8888-8888',
    correo: 'e2e-prov@test.com',
    pais: 'Costa Rica',
    estado: 'ACTIVO',
    ...overrides,
  };
}

export function categoriaE2ePayload(overrides = {}) {
  return {
    nombre: 'E2E Categoria',
    descripcion: 'Categoria para pruebas E2E',
    activo: true,
    ...overrides,
  };
}

export function tarifaE2ePayload(overrides = {}) {
  return {
    codigo: 'E2E-IVA-13',
    porcentaje: 13,
    descripcion: 'Tarifa IVA E2E 13%',
    estado: 'ACTIVA',
    ...overrides,
  };
}

export function pedidoE2ePayload(
  proveedorId: number,
  categoriaId = 1,
  overrides = {},
) {
  return {
    fecha: todayIso(),
    origen: 'NACIONAL',
    proveedorId,
    monedaCompra: 'CRC',
    tipoCambio: 1,
    estado: 'REGISTRADO',
    observaciones: 'Pedido inicial E2E',
    detalles: [
      {
        categoriaId,
        productoNombre: 'Producto E2E',
        loteCodigo: 'L1',
        cantidad: 5,
        costoUnitarioOrigen: 1000,
        precioVentaRecomendado: 2000,
        estadoLote: 'EN_PROCESO',
      },
    ],
    ...overrides,
  };
}

export function recepcionE2ePayload(idLote: number, cantidadRecibida = 5) {
  return {
    fechaRecepcion: todayIso(),
    detalles: [
      {
        idLote,
        cantidadRecibida,
      },
    ],
  };
}

export function ventaE2ePayload(productoId: number, overrides = {}) {
  return {
    numeroVenta: 2001,
    fechaVenta: todayIso(),
    clienteNombre: 'Cliente E2E',
    medioPago: 'EFECTIVO',
    montoPagado: 2000,
    detalles: [
      {
        productoId,
        cantidad: 2,
        precioUnitario: 2000,
        tipoTarifa: 'EXENTO',
      },
    ],
    ...overrides,
  };
}

export function pagoVentaE2ePayload(monto = 2000, overrides = {}) {
  return {
    monto,
    metodoPago: 'TRANSFERENCIA',
    referencia: 'REF-E2E-001',
    observaciones: 'Abono final E2E',
    ...overrides,
  };
}
