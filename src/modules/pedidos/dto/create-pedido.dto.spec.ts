import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePedidoDetalleDto, CreatePedidoDto } from './create-pedido.dto';

async function validarDto<T extends object>(cls: new () => T, datos: object) {
  const instancia = plainToInstance(cls, datos);
  return validate(instancia);
}

describe('CreatePedidoDto & CreatePedidoDetalleDto', () => {
  const detalleValido = {
    productoNombre: 'Filtro de aceite',
    categoriaId: 1,
    loteCodigo: 'L1',
    cantidad: 5,
    costoUnitarioOrigen: 2500,
    precioVentaRecomendado: 4000,
    estadoLote: 'EN_PROCESO',
    cantidadRecibida: 0,
  };

  const pedidoValido = {
    numeroPedido: 1,
    fecha: '2026-09-06',
    origen: 'Costa Rica',
    proveedorId: 1,
    monedaCompra: 'CRC',
    tipoCambio: 1,
    estado: 'REGISTRADO',
    observaciones: 'Nota valida',
    detalles: [detalleValido],
  };

  it('debe validar un DTO de pedido correcto', async () => {
    const errores = await validarDto(CreatePedidoDto, pedidoValido);
    expect(errores.length).toBe(0);
  });

  it('debe rechazar una fecha inválida', async () => {
    const errores = await validarDto(CreatePedidoDto, {
      ...pedidoValido,
      fecha: 'mañana',
    });
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].property).toBe('fecha');
  });

  it('debe permitir estados REGISTRADO y EN_TRANSITO', async () => {
    const errReg = await validarDto(CreatePedidoDto, {
      ...pedidoValido,
      estado: 'REGISTRADO',
    });
    expect(errReg.length).toBe(0);

    const errTrans = await validarDto(CreatePedidoDto, {
      ...pedidoValido,
      estado: 'EN_TRANSITO',
    });
    expect(errTrans.length).toBe(0);
  });

  it('debe rechazar estado RECIBIDO o CANCELADO en la creación', async () => {
    const errRec = await validarDto(CreatePedidoDto, {
      ...pedidoValido,
      estado: 'RECIBIDO',
    });
    expect(errRec.length).toBeGreaterThan(0);

    const errCanc = await validarDto(CreatePedidoDto, {
      ...pedidoValido,
      estado: 'CANCELADO',
    });
    expect(errCanc.length).toBeGreaterThan(0);
  });

  it('debe validar que estadoLote solo admita EN_PROCESO', async () => {
    const errProc = await validarDto(CreatePedidoDetalleDto, detalleValido);
    expect(errProc.length).toBe(0);

    for (const estadoInvalido of [
      'EN_STOCK',
      'VENDIDO_PARCIAL',
      'AGOTADO',
      'OTRO',
    ]) {
      const errores = await validarDto(CreatePedidoDetalleDto, {
        ...detalleValido,
        estadoLote: estadoInvalido,
      });
      expect(errores.length).toBeGreaterThan(0);
    }
  });

  it('debe rechazar cantidadRecibida mayor a 0 en la creación', async () => {
    const errCero = await validarDto(CreatePedidoDetalleDto, {
      ...detalleValido,
      cantidadRecibida: 0,
    });
    expect(errCero.length).toBe(0);

    const errUno = await validarDto(CreatePedidoDetalleDto, {
      ...detalleValido,
      cantidadRecibida: 1,
    });
    expect(errUno.length).toBeGreaterThan(0);

    const errCinco = await validarDto(CreatePedidoDetalleDto, {
      ...detalleValido,
      cantidadRecibida: 5,
    });
    expect(errCinco.length).toBeGreaterThan(0);
  });

  it('debe validar longitud máxima del nombre del producto (150 caracteres)', async () => {
    const nombre150 = 'A'.repeat(150);
    const err150 = await validarDto(CreatePedidoDetalleDto, {
      ...detalleValido,
      productoNombre: nombre150,
    });
    expect(err150.length).toBe(0);

    const nombre151 = 'A'.repeat(151);
    const err151 = await validarDto(CreatePedidoDetalleDto, {
      ...detalleValido,
      productoNombre: nombre151,
    });
    expect(err151.length).toBeGreaterThan(0);
  });
});
