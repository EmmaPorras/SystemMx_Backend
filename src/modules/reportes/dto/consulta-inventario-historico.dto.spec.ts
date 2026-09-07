import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConsultaInventarioHistoricoDto } from './consulta-inventario-historico.dto';

describe('ConsultaInventarioHistoricoDto', () => {
  it('debe ser válido con fechaCorte en formato YYYY-MM-DD', async () => {
    const dto = plainToInstance(ConsultaInventarioHistoricoDto, {
      fechaCorte: '2026-09-12',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('debe fallar si fechaCorte es omitida', async () => {
    const dto = plainToInstance(ConsultaInventarioHistoricoDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debe fallar si fechaCorte tiene formato DD/MM/YYYY', async () => {
    const dto = plainToInstance(ConsultaInventarioHistoricoDto, {
      fechaCorte: '12/09/2026',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBeDefined();
  });

  it('debe fallar si fechaCorte es datetime completo', async () => {
    const dto = plainToInstance(ConsultaInventarioHistoricoDto, {
      fechaCorte: '2026-09-12T10:00:00.000Z',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBeDefined();
  });

  it('debe fallar si fechaCorte es texto arbitrario', async () => {
    const dto = plainToInstance(ConsultaInventarioHistoricoDto, {
      fechaCorte: 'fecha-invalida',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBeDefined();
  });
});
