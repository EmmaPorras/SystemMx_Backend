import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ConsultaPeriodoDto } from './consulta-periodo.dto';

describe('ConsultaPeriodoDto', () => {
  it('debe aceptar objeto vacío sin fechas', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debe aceptar fechaDesde válida', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {
      fechaDesde: '2026-09-01',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debe aceptar fechaHasta válida', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {
      fechaHasta: '2026-09-12',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debe aceptar ambas fechas con formato YYYY-MM-DD válido', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {
      fechaDesde: '2026-09-01',
      fechaHasta: '2026-09-12',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debe rechazar formato datetime completo', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {
      fechaDesde: '2026-09-01T00:00:00.000Z',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBe(
      'fechaDesde debe tener formato YYYY-MM-DD.',
    );
  });

  it('debe rechazar formato DD/MM/YYYY', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {
      fechaHasta: '12/09/2026',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBe(
      'fechaHasta debe tener formato YYYY-MM-DD.',
    );
  });

  it('debe rechazar texto arbitrario', async () => {
    const dto = plainToInstance(ConsultaPeriodoDto, {
      fechaDesde: 'invalido',
      fechaHasta: 'ayer',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(2);
  });
});
