import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ConsultaAuditoriaDto } from './consulta-auditoria.dto';

describe('ConsultaAuditoriaDto', () => {
  it('debe ser válido sin parámetros', async () => {
    const dto = plainToInstance(ConsultaAuditoriaDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('debe ser válido con usuarioId entero positivo (1, 25)', async () => {
    const dto1 = plainToInstance(ConsultaAuditoriaDto, { usuarioId: 1 });
    const dto25 = plainToInstance(ConsultaAuditoriaDto, { usuarioId: '25' });

    expect((await validate(dto1)).length).toBe(0);
    expect((await validate(dto25)).length).toBe(0);
    expect(dto25.usuarioId).toBe(25);
  });

  it('debe fallar si usuarioId es 0 o negativo', async () => {
    const dto0 = plainToInstance(ConsultaAuditoriaDto, { usuarioId: 0 });
    const dtoNeg = plainToInstance(ConsultaAuditoriaDto, { usuarioId: -1 });

    const errors0 = await validate(dto0);
    const errorsNeg = await validate(dtoNeg);

    expect(errors0.length).toBeGreaterThan(0);
    expect(errorsNeg.length).toBeGreaterThan(0);
  });

  it('debe fallar si usuarioId es decimal o texto no convertible', async () => {
    const dtoDec = plainToInstance(ConsultaAuditoriaDto, { usuarioId: 1.5 });
    const dtoTxt = plainToInstance(ConsultaAuditoriaDto, {
      usuarioId: 'admin',
    });

    const errorsDec = await validate(dtoDec);
    const errorsTxt = await validate(dtoTxt);

    expect(errorsDec.length).toBeGreaterThan(0);
    expect(errorsTxt.length).toBeGreaterThan(0);
  });

  it('debe validar fechas heredadas en formato YYYY-MM-DD', async () => {
    const dtoOk = plainToInstance(ConsultaAuditoriaDto, {
      fechaDesde: '2026-09-01',
      fechaHasta: '2026-09-12',
      usuarioId: 2,
    });
    const dtoBad = plainToInstance(ConsultaAuditoriaDto, {
      fechaDesde: '01/09/2026',
    });

    expect((await validate(dtoOk)).length).toBe(0);
    expect((await validate(dtoBad)).length).toBeGreaterThan(0);
  });
});
