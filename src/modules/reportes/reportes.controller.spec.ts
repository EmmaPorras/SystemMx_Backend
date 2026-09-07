import { Test, TestingModule } from '@nestjs/testing';

import { ConsultaPeriodoDto } from './dto/consulta-periodo.dto';
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
      resumenVentas: jest.fn().mockResolvedValue({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadVentas: 7,
        subtotal: 42500,
        descuentos: 0,
        iva: 0,
        ventas: 42500,
        costo: 29500,
        gananciaBruta: 13000,
        margenBrutoPorcentaje: 30.59,
        montoPagado: 32500,
        saldoPendiente: 10000,
      }),
      evolucionVentas: jest.fn().mockResolvedValue([
        {
          fecha: '2026-09-10',
          cantidadVentas: 1,
          ventas: 5000,
          costo: 3000,
          gananciaBruta: 2000,
          margenBrutoPorcentaje: 40,
        },
      ]),
      ventasPorProducto: jest.fn().mockResolvedValue([
        {
          idProducto: 9,
          producto: 'Producto movimiento prueba',
          categoria: 'Sin categoría',
          unidadesVendidas: 5,
          ventas: 31000,
          costo: 22500,
          gananciaBruta: 8500,
          margenBrutoPorcentaje: 27.42,
        },
      ]),
      ventasPorLote: jest.fn().mockResolvedValue([
        {
          idLote: 17,
          codigoLote: 'L2',
          idProducto: 9,
          producto: 'Producto movimiento prueba',
          unidadesVendidas: 5,
          ventas: 31000,
          costo: 22500,
          gananciaBruta: 8500,
          margenBrutoPorcentaje: 27.42,
        },
      ]),
      ventasAnuladas: jest.fn().mockResolvedValue({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidad: 8,
        importeOriginal: 142500,
        costoOriginal: 85500,
        gananciaOriginal: 57000,
        montoPagadoHistorico: 26500,
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

  it('GET /reportes/resumen debe delegar al servicio', async () => {
    const dto: ConsultaResumenDto = {
      fechaDesde: '2026-09-01',
      fechaHasta: '2026-09-12',
    };
    const res = await controller.resumen(dto);
    expect(reportesService.resumen).toHaveBeenCalledWith(dto);
    expect(res.ventas.total).toBe(42500);
  });

  it('GET /reportes/ventas/resumen debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {
      fechaDesde: '2026-09-01',
    };
    const res = await controller.resumenVentas(dto);
    expect(reportesService.resumenVentas).toHaveBeenCalledWith(dto);
    expect(res.cantidadVentas).toBe(7);
  });

  it('GET /reportes/ventas/evolucion debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.evolucionVentas(dto);
    expect(reportesService.evolucionVentas).toHaveBeenCalledWith(dto);
    expect(res).toHaveLength(1);
  });

  it('GET /reportes/ventas/productos debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.ventasPorProducto(dto);
    expect(reportesService.ventasPorProducto).toHaveBeenCalledWith(dto);
    expect(res[0].idProducto).toBe(9);
  });

  it('GET /reportes/ventas/lotes debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.ventasPorLote(dto);
    expect(reportesService.ventasPorLote).toHaveBeenCalledWith(dto);
    expect(res[0].idLote).toBe(17);
  });

  it('GET /reportes/ventas/anuladas debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.ventasAnuladas(dto);
    expect(reportesService.ventasAnuladas).toHaveBeenCalledWith(dto);
    expect(res.cantidad).toBe(8);
  });
});
