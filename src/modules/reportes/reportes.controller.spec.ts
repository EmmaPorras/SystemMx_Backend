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
      resumenInventario: jest.fn().mockResolvedValue({
        totalLotes: 24,
        lotesConStock: 10,
        unidadesRecibidas: 61,
        unidadesDisponibles: 54,
        valorCosto: 204000,
        estados: {
          agotados: 2,
          enProceso: 12,
          enStock: 9,
          vendidoParcial: 1,
        },
      }),
      inventarioPorProducto: jest.fn().mockResolvedValue([
        {
          idProducto: 6,
          producto: 'Aceite recepción prueba',
          categoria: 'Sin categoría',
          lotes: 2,
          lotesConStock: 2,
          cantidadRecibida: 26,
          stockDisponible: 26,
          valorCosto: 104000,
        },
      ]),
      inventarioPorEstado: jest.fn().mockResolvedValue([
        {
          estado: 'EN_STOCK',
          lotes: 9,
          unidadesRecibidas: 45,
          unidadesDisponibles: 45,
          valorCostoDisponible: 174000,
        },
      ]),
      productosSinStock: jest.fn().mockResolvedValue([
        {
          idProducto: 1,
          producto: 'Casco Integral',
          cantidadRecibida: 0,
          stockDisponible: 0,
          lotesEnProceso: 1,
          lotesAgotados: 0,
        },
      ]),
      historicoInventario: jest.fn().mockResolvedValue({
        fechaCorte: '2026-09-12',
        cobertura: {
          lotesTotales: 24,
          lotesConHistorialCompleto: 20,
          lotesLegacy: 4,
          coberturaCompleta: false,
          lotesInconsistentes: 0,
        },
        reconstruccion: {
          unidades: 45,
          valorCosto: 170000,
        },
        lotes: [],
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

  it('GET /reportes/inventario/resumen debe delegar al servicio', async () => {
    const res = await controller.resumenInventario();
    expect(reportesService.resumenInventario).toHaveBeenCalled();
    expect(res.totalLotes).toBe(24);
  });

  it('GET /reportes/inventario/productos debe delegar al servicio', async () => {
    const res = await controller.inventarioPorProducto();
    expect(reportesService.inventarioPorProducto).toHaveBeenCalled();
    expect(res[0].producto).toBe('Aceite recepción prueba');
  });

  it('GET /reportes/inventario/estados debe delegar al servicio', async () => {
    const res = await controller.inventarioPorEstado();
    expect(reportesService.inventarioPorEstado).toHaveBeenCalled();
    expect(res[0].estado).toBe('EN_STOCK');
  });

  it('GET /reportes/inventario/sin-stock debe delegar al servicio', async () => {
    const res = await controller.productosSinStock();
    expect(reportesService.productosSinStock).toHaveBeenCalled();
    expect(res[0].stockDisponible).toBe(0);
  });

  it('GET /reportes/inventario/historico debe delegar al servicio', async () => {
    const dto = { fechaCorte: '2026-09-12' };
    const res = await controller.historicoInventario(dto);
    expect(reportesService.historicoInventario).toHaveBeenCalledWith(dto);
    expect(res.fechaCorte).toBe('2026-09-12');
  });
});
