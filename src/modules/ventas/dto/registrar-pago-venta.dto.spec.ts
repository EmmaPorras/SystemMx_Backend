import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegistrarPagoVentaDto } from './registrar-pago-venta.dto';

describe('RegistrarPagoVentaDto', () => {
  it('debe ser válido con datos correctos de pago', async () => {
    const dto = plainToInstance(RegistrarPagoVentaDto, {
      monto: 2000,
      metodoPago: 'SINPE',
      referencia: 'REF-1234',
      observaciones: 'Primer abono',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debe rechazar monto 0 o negativo', async () => {
    const dtoCero = plainToInstance(RegistrarPagoVentaDto, {
      monto: 0,
      metodoPago: 'EFECTIVO',
    });
    const errorsCero = await validate(dtoCero);
    expect(errorsCero.length).toBeGreaterThan(0);

    const dtoNegativo = plainToInstance(RegistrarPagoVentaDto, {
      monto: -10,
      metodoPago: 'EFECTIVO',
    });
    const errorsNegativo = await validate(dtoNegativo);
    expect(errorsNegativo.length).toBeGreaterThan(0);
  });

  it('debe rechazar monto con más de 2 decimales', async () => {
    const dto = plainToInstance(RegistrarPagoVentaDto, {
      monto: 1.123,
      metodoPago: 'EFECTIVO',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debe aceptar todos los métodos de pago válidos', async () => {
    const metodos = [
      'EFECTIVO',
      'SINPE',
      'TRANSFERENCIA',
      'TARJETA',
      'MIXTO',
      'OTRO',
    ];

    for (const metodo of metodos) {
      const dto = plainToInstance(RegistrarPagoVentaDto, {
        monto: 500,
        metodoPago: metodo,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('debe rechazar métodos de pago no permitidos', async () => {
    const dto = plainToInstance(RegistrarPagoVentaDto, {
      monto: 500,
      metodoPago: 'BITCOIN_MAGICO',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debe rechazar referencia que supere 150 caracteres', async () => {
    const dto = plainToInstance(RegistrarPagoVentaDto, {
      monto: 500,
      metodoPago: 'EFECTIVO',
      referencia: 'A'.repeat(151),
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
