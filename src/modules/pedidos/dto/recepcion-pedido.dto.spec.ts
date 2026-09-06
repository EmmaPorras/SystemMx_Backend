import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  RecepcionPedidoDetalleDto,
  RecepcionPedidoDto,
} from './recepcion-pedido.dto';

async function validarDto<T extends object>(cls: new () => T, datos: object) {
  const instancia = plainToInstance(cls, datos);
  return validate(instancia);
}

describe('RecepcionPedidoDto & RecepcionPedidoDetalleDto', () => {
  const detalleValido = {
    idLote: 10,
    cantidadRecibida: 5,
  };

  const recepcionValida = {
    fechaRecepcion: '2026-09-06',
    detalles: [detalleValido],
  };

  it('debe validar un DTO de recepción correcto', async () => {
    const errores = await validarDto(RecepcionPedidoDto, recepcionValida);
    expect(errores.length).toBe(0);
  });

  it('debe rechazar una fecha de recepción inválida', async () => {
    const errores = await validarDto(RecepcionPedidoDto, {
      ...recepcionValida,
      fechaRecepcion: 'ayer',
    });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('debe rechazar lista de detalles vacía', async () => {
    const errores = await validarDto(RecepcionPedidoDto, {
      ...recepcionValida,
      detalles: [],
    });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('debe validar idLote como entero mayor o igual a 1', async () => {
    const errValido = await validarDto(RecepcionPedidoDetalleDto, {
      idLote: 1,
      cantidadRecibida: 2,
    });
    expect(errValido.length).toBe(0);

    for (const idInvalido of [0, -1, 1.5, 'abc']) {
      const errores = await validarDto(RecepcionPedidoDetalleDto, {
        idLote: idInvalido,
        cantidadRecibida: 2,
      });
      expect(errores.length).toBeGreaterThan(0);
    }
  });

  it('debe validar cantidadRecibida como entero mayor o igual a 1', async () => {
    const errValido = await validarDto(RecepcionPedidoDetalleDto, {
      idLote: 1,
      cantidadRecibida: 1,
    });
    expect(errValido.length).toBe(0);

    for (const cantInvalida of [0, -1, 1.5, 'dos']) {
      const errores = await validarDto(RecepcionPedidoDetalleDto, {
        idLote: 1,
        cantidadRecibida: cantInvalida,
      });
      expect(errores.length).toBeGreaterThan(0);
    }
  });
});
