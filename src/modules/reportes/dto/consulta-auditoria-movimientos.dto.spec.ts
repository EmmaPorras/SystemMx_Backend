import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ConsultaAuditoriaMovimientosDto } from './consulta-auditoria-movimientos.dto';

describe('ConsultaAuditoriaMovimientosDto', () => {
  it('debe ser válido con tipos de movimiento permitidos', async () => {
    const tipos = [
      'ENTRADA_COMPRA',
      'SALIDA_VENTA',
      'REINGRESO_ANULACION_VENTA',
    ];

    for (const tipo of tipos) {
      const dto = plainToInstance(ConsultaAuditoriaMovimientosDto, {
        tipoMovimiento: tipo,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('debe fallar con tipo de movimiento no permitido', async () => {
    const dto = plainToInstance(ConsultaAuditoriaMovimientosDto, {
      tipoMovimiento: 'HACK',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isIn).toBeDefined();
  });

  it('debe permitir tipoMovimiento ausente con otros filtros válidos', async () => {
    const dto = plainToInstance(ConsultaAuditoriaMovimientosDto, {
      usuarioId: 2,
      fechaDesde: '2026-09-01',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
