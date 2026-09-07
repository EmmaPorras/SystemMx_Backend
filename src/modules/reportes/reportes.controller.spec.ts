import { Test, TestingModule } from '@nestjs/testing';

import { ConsultaResumenDto } from './dto/consulta-resumen.dto';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

describe('ReportesController', () => {
  let controller: ReportesController;
  let reportesService: jest.Mocked<Partial<ReportesService>>;

  beforeEach(async () => {
    reportesService = {
      resumen: jest.fn().mockResolvedValue({
        periodo: { fechaDesde: null, fechaHasta: null },
        ventas: {
          cantidad: 7,
          total: 42500,
          costo: 29500,
          gananciaBruta: 13000,
          margenBrutoPorcentaje: 30.59,
          montoPagado: 32500,
          saldoPendiente: 10000,
        },
        inventario: {
          lotesConStock: 10,
          unidadesDisponibles: 54,
          valorCosto: 204000,
        },
        cuentasPorCobrar: {
          ventasConSaldo: 3,
          saldo: 10000,
        },
        pedidos: {
          registrados: 7,
          enTransito: 5,
          recibidos: 7,
          cancelados: 4,
          pendientes: 12,
          total: 23,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        {
          provide: ReportesService,
          useValue: reportesService,
        },
      ],
    }).compile();

    controller = module.get<ReportesController>(ReportesController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe delegar la consulta de resumen al servicio', async () => {
    const dto: ConsultaResumenDto = {
      fechaDesde: '2026-09-01',
      fechaHasta: '2026-09-12',
    };

    const resultado = await controller.resumen(dto);

    expect(reportesService.resumen).toHaveBeenCalledWith(dto);
    expect(resultado.ventas.total).toBe(42500);
  });
});
