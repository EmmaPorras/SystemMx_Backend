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
      resumenCompras: jest.fn().mockResolvedValue({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadPedidos: 19,
        unidadesPedidas: 100,
        unidadesRecibidas: 61,
        unidadesPendientes: 39,
        recepcionConsistente: true,
        mercaderiaColones: 300000,
        envio: 20000,
        impuestos: 15000,
        otrosGastos: 5000,
        costoReal: 340000,
        diferenciaCosto: 0,
        costoConsistente: true,
      }),
      evolucionCompras: jest.fn().mockResolvedValue([
        {
          fecha: '2026-09-10',
          pedidos: 2,
          unidadesPedidas: 20,
          mercaderiaColones: 50000,
          envio: 5000,
          impuestos: 2500,
          otrosGastos: 1000,
          costoReal: 58500,
        },
      ]),
      comprasPorProveedor: jest.fn().mockResolvedValue([
        {
          idProveedor: 1,
          proveedor: 'Proveedor Central',
          pedidos: 5,
          unidadesPedidas: 40,
          mercaderiaColones: 120000,
          costosAdicionales: 15000,
          costoReal: 135000,
        },
      ]),
      comprasPorProducto: jest.fn().mockResolvedValue([
        {
          idProducto: 6,
          producto: 'Aceite recepción prueba',
          categoria: 'Sin categoría',
          pedidos: 3,
          unidadesPedidas: 27,
          mercaderiaColones: 81000,
          envio: 8000,
          impuestos: 4000,
          otrosGastos: 2000,
          costoReal: 95000,
        },
      ]),
      composicionCostosCompras: jest.fn().mockResolvedValue({
        mercaderia: { monto: 300000, porcentaje: 88.24 },
        envio: { monto: 20000, porcentaje: 5.88 },
        impuestos: { monto: 15000, porcentaje: 4.41 },
        otrosGastos: { monto: 5000, porcentaje: 1.47 },
        costoReal: 340000,
        diferencia: 0,
        consistente: true,
      }),
      comprasCanceladas: jest.fn().mockResolvedValue({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadPedidos: 4,
        unidadesPlaneadas: 25,
        mercaderiaOriginal: 75000,
        costoRealOriginal: 82000,
      }),
      resumenPagos: jest.fn().mockResolvedValue({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadPagos: 12,
        ventasConPago: 8,
        montoRegistrado: 50000,
        montoVentasActivas: 27500,
        montoVentasAnuladas: 22500,
      }),
      pagosPorMetodo: jest.fn().mockResolvedValue([
        {
          metodoPago: 'SINPE',
          pagos: 3,
          montoTotal: 16500,
          montoVentasActivas: 16500,
          montoVentasAnuladas: 0,
        },
      ]),
      evolucionPagos: jest.fn().mockResolvedValue([
        {
          fecha: '2026-09-10',
          pagos: 2,
          montoTotal: 10000,
          montoVentasActivas: 10000,
          montoVentasAnuladas: 0,
        },
      ]),
      conciliacionPagos: jest.fn().mockResolvedValue({
        resumen: {
          ventasActivas: 7,
          conciliadas: 6,
          historialIncompleto: 1,
          inconsistentes: 0,
          montoPagadoVenta: 32500,
          montoLedger: 27500,
          diferenciaCobertura: 5000,
        },
        detalle: [],
      }),
      cuentasPorCobrar: jest.fn().mockResolvedValue({
        resumen: {
          ventasConSaldo: 3,
          totalPorCobrar: 10000,
        },
        detalle: [],
      }),
      vencimientosCuentasPorCobrar: jest.fn().mockResolvedValue({
        fechaCorte: '2026-09-12',
        sinVencimiento: { cantidad: 3, saldo: 10000 },
        vencidas: { cantidad: 0, saldo: 0 },
        venceEnFechaCorte: { cantidad: 0, saldo: 0 },
        porVencer: { cantidad: 0, saldo: 0 },
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

  it('GET /reportes/compras/resumen debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = { fechaDesde: '2026-09-01' };
    const res = await controller.resumenCompras(dto);
    expect(reportesService.resumenCompras).toHaveBeenCalledWith(dto);
    expect(res.cantidadPedidos).toBe(19);
  });

  it('GET /reportes/compras/evolucion debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.evolucionCompras(dto);
    expect(reportesService.evolucionCompras).toHaveBeenCalledWith(dto);
    expect(res).toHaveLength(1);
  });

  it('GET /reportes/compras/proveedores debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.comprasPorProveedor(dto);
    expect(reportesService.comprasPorProveedor).toHaveBeenCalledWith(dto);
    expect(res[0].idProveedor).toBe(1);
  });

  it('GET /reportes/compras/productos debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.comprasPorProducto(dto);
    expect(reportesService.comprasPorProducto).toHaveBeenCalledWith(dto);
    expect(res[0].idProducto).toBe(6);
  });

  it('GET /reportes/compras/costos debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.composicionCostosCompras(dto);
    expect(reportesService.composicionCostosCompras).toHaveBeenCalledWith(dto);
    expect(res.costoReal).toBe(340000);
  });

  it('GET /reportes/compras/canceladas debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.comprasCanceladas(dto);
    expect(reportesService.comprasCanceladas).toHaveBeenCalledWith(dto);
    expect(res.cantidadPedidos).toBe(4);
  });

  it('GET /reportes/pagos/resumen debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = { fechaDesde: '2026-09-01' };
    const res = await controller.resumenPagos(dto);
    expect(reportesService.resumenPagos).toHaveBeenCalledWith(dto);
    expect(res.cantidadPagos).toBe(12);
  });

  it('GET /reportes/pagos/evolucion debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.evolucionPagos(dto);
    expect(reportesService.evolucionPagos).toHaveBeenCalledWith(dto);
    expect(res).toHaveLength(1);
  });

  it('GET /reportes/pagos/metodos debe delegar al servicio', async () => {
    const dto: ConsultaPeriodoDto = {};
    const res = await controller.pagosPorMetodo(dto);
    expect(reportesService.pagosPorMetodo).toHaveBeenCalledWith(dto);
    expect(res[0].metodoPago).toBe('SINPE');
  });

  it('GET /reportes/pagos/conciliacion debe delegar al servicio', async () => {
    const res = await controller.conciliacionPagos();
    expect(reportesService.conciliacionPagos).toHaveBeenCalled();
    expect(res.resumen.ventasActivas).toBe(7);
  });

  it('GET /reportes/cuentas-por-cobrar debe delegar al servicio', async () => {
    const res = await controller.cuentasPorCobrar();
    expect(reportesService.cuentasPorCobrar).toHaveBeenCalled();
    expect(res.resumen.ventasConSaldo).toBe(3);
  });

  it('GET /reportes/cuentas-por-cobrar/vencimientos debe delegar al servicio', async () => {
    const dto = { fechaCorte: '2026-09-12' };
    const res = await controller.vencimientosCuentasPorCobrar(dto);
    expect(reportesService.vencimientosCuentasPorCobrar).toHaveBeenCalledWith(
      dto,
    );
    expect(res.fechaCorte).toBe('2026-09-12');
  });
});
