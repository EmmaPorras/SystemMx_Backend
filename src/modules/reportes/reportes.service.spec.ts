import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { PagoVenta } from '../../database/entities/pago-venta.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { VentaEntity } from '../../database/entities/venta.entity';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let service: ReportesService;
  let ventasRepository: jest.Mocked<Partial<Repository<VentaEntity>>>;
  let detallesVentaRepository: jest.Mocked<Partial<Repository<DetalleVenta>>>;
  let lotesRepository: jest.Mocked<Partial<Repository<LoteProducto>>>;
  let pedidosRepository: jest.Mocked<Partial<Repository<PedidoCompraEntity>>>;
  let detallesPedidoRepository: jest.Mocked<
    Partial<Repository<DetallePedidoCompra>>
  >;
  let productosRepository: jest.Mocked<Partial<Repository<Producto>>>;
  let categoriasRepository: jest.Mocked<Partial<Repository<Categoria>>>;
  let proveedoresRepository: jest.Mocked<Partial<Repository<OrigenCompra>>>;
  let movimientosRepository: jest.Mocked<
    Partial<Repository<MovimientoInventario>>
  >;
  let pagosRepository: jest.Mocked<Partial<Repository<PagoVenta>>>;

  let ventasQueryBuilder: Partial<SelectQueryBuilder<VentaEntity>>;
  let detallesQueryBuilder: Partial<SelectQueryBuilder<DetalleVenta>>;
  let lotesQueryBuilder: Partial<SelectQueryBuilder<LoteProducto>>;
  let pedidosQueryBuilder: Partial<SelectQueryBuilder<PedidoCompraEntity>>;
  let detallesPedidoQueryBuilder: Partial<
    SelectQueryBuilder<DetallePedidoCompra>
  >;
  let productosQueryBuilder: Partial<SelectQueryBuilder<Producto>>;
  let pagosQueryBuilder: Partial<SelectQueryBuilder<PagoVenta>>;

  beforeEach(async () => {
    ventasQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        cantidad: '7',
        cantidadVentas: '7',
        subtotal: '42500.00',
        descuentos: '0.00',
        iva: '0.00',
        total: '42500.00',
        ventas: '42500.00',
        costo: '29500.00',
        gananciaBruta: '13000.00',
        montoPagado: '32500.00',
        saldoPendiente: '10000.00',
        ventasConSaldo: '3',
        saldo: '10000.00',
        importeOriginal: '142500.00',
        costoOriginal: '85500.00',
        gananciaOriginal: '57000.00',
        montoPagadoHistorico: '26500.00',
      }),
      getRawMany: jest.fn().mockResolvedValue([
        {
          fecha: '2026-09-10',
          cantidadVentas: '1',
          ventas: '5000.00',
          costo: '3000.00',
          gananciaBruta: '2000.00',
        },
        {
          fecha: '2026-09-12',
          cantidadVentas: '6',
          ventas: '37500.00',
          costo: '26500.00',
          gananciaBruta: '11000.00',
        },
      ]),
    };

    detallesQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          idProducto: '9',
          producto: 'Producto movimiento prueba',
          categoria: 'Sin categoría',
          unidadesVendidas: '5',
          ventas: '31000.00',
          costo: '22500.00',
          gananciaBruta: '8500.00',
        },
        {
          idProducto: '6',
          producto: 'Aceite recepción prueba',
          categoria: 'Sin categoría',
          unidadesVendidas: '1',
          ventas: '6500.00',
          costo: '4000.00',
          gananciaBruta: '2500.00',
        },
        {
          idProducto: '10',
          producto: 'Producto Concurrencia Lock',
          categoria: 'Sin categoría',
          unidadesVendidas: '1',
          ventas: '5000.00',
          costo: '3000.00',
          gananciaBruta: '2000.00',
        },
      ]),
    };

    lotesQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalLotes: '24',
        lotesConStock: '10',
        unidadesRecibidas: '61',
        unidadesDisponibles: '54',
        valorCosto: '204000.00',
        agotados: '2',
        enProceso: '12',
        enStock: '9',
        vendidoParcial: '1',
      }),
      getRawMany: jest.fn().mockResolvedValue([
        {
          estado: 'AGOTADO',
          lotes: '2',
          unidadesRecibidas: '6',
          unidadesDisponibles: '0',
          valorCostoDisponible: '0.00',
        },
        {
          estado: 'EN_PROCESO',
          lotes: '12',
          unidadesRecibidas: '0',
          unidadesDisponibles: '0',
          valorCostoDisponible: '0.00',
        },
        {
          estado: 'EN_STOCK',
          lotes: '9',
          unidadesRecibidas: '45',
          unidadesDisponibles: '45',
          valorCostoDisponible: '174000.00',
        },
        {
          estado: 'VENDIDO_PARCIAL',
          lotes: '1',
          unidadesRecibidas: '10',
          unidadesDisponibles: '9',
          valorCostoDisponible: '30000.00',
        },
      ]),
    };

    pedidosQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { estado: 'REGISTRADO', cantidad: '7' },
        { estado: 'EN_TRANSITO', cantidad: '5' },
        { estado: 'RECIBIDO', cantidad: '7' },
        { estado: 'CANCELADO', cantidad: '4' },
      ]),
    };

    detallesPedidoQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        cantidadPedidos: '19',
        unidadesPedidas: '100',
        unidadesPlaneadas: '25',
        mercaderiaColones: '300000.00',
        mercaderiaOriginal: '75000.00',
        envio: '20000.00',
        impuestos: '15000.00',
        otrosGastos: '5000.00',
        costoReal: '340000.00',
        costoRealOriginal: '82000.00',
      }),
      getRawMany: jest.fn().mockResolvedValue([
        {
          fecha: '2026-09-10',
          pedidos: '2',
          unidadesPedidas: '20',
          mercaderiaColones: '50000.00',
          envio: '5000.00',
          impuestos: '2500.00',
          otrosGastos: '1000.00',
          costoReal: '58500.00',
          idProveedor: '1',
          proveedor: 'Proveedor Central',
          costosAdicionales: '8500.00',
          idProducto: '6',
          producto: 'Aceite recepción prueba',
          categoria: 'Sin categoría',
        },
      ]),
    };

    productosQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          idProducto: '6',
          producto: 'Aceite recepción prueba',
          categoria: 'Sin categoría',
          lotes: '2',
          lotesConStock: '2',
          cantidadRecibida: '26',
          stockDisponible: '26',
          valorCosto: '104000.00',
        },
        {
          idProducto: '9',
          producto: 'Producto movimiento prueba',
          categoria: 'Sin categoría',
          lotes: '1',
          lotesConStock: '1',
          cantidadRecibida: '10',
          stockDisponible: '10',
          valorCosto: '40000.00',
        },
      ]),
    };

    ventasRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(ventasQueryBuilder),
    };

    detallesVentaRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(detallesQueryBuilder),
    };

    lotesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(lotesQueryBuilder),
    };

    pedidosRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(pedidosQueryBuilder),
    };

    detallesPedidoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(detallesPedidoQueryBuilder),
    };

    productosRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(productosQueryBuilder),
    };

    categoriasRepository = {
      createQueryBuilder: jest.fn(),
    };

    proveedoresRepository = {
      createQueryBuilder: jest.fn(),
    };

    movimientosRepository = {
      createQueryBuilder: jest.fn(),
    };

    pagosQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        cantidadPagos: '12',
        ventasConPago: '8',
        montoRegistrado: '50000.00',
        montoVentasActivas: '27500.00',
        montoVentasAnuladas: '22500.00',
      }),
      getRawMany: jest.fn().mockResolvedValue([
        {
          metodoPago: 'SINPE',
          pagos: '3',
          montoTotal: '16500.00',
          montoVentasActivas: '16500.00',
          montoVentasAnuladas: '0.00',
        },
        {
          metodoPago: 'TARJETA',
          pagos: '1',
          montoTotal: '6500.00',
          montoVentasActivas: '6500.00',
          montoVentasAnuladas: '0.00',
        },
        {
          metodoPago: 'EFECTIVO',
          pagos: '2',
          montoTotal: '4500.00',
          montoVentasActivas: '4500.00',
          montoVentasAnuladas: '0.00',
        },
      ]),
    };

    pagosRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(pagosQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: getRepositoryToken(VentaEntity),
          useValue: ventasRepository,
        },
        {
          provide: getRepositoryToken(DetalleVenta),
          useValue: detallesVentaRepository,
        },
        {
          provide: getRepositoryToken(LoteProducto),
          useValue: lotesRepository,
        },
        {
          provide: getRepositoryToken(PedidoCompraEntity),
          useValue: pedidosRepository,
        },
        {
          provide: getRepositoryToken(DetallePedidoCompra),
          useValue: detallesPedidoRepository,
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: productosRepository,
        },
        {
          provide: getRepositoryToken(Categoria),
          useValue: categoriasRepository,
        },
        {
          provide: getRepositoryToken(OrigenCompra),
          useValue: proveedoresRepository,
        },
        {
          provide: getRepositoryToken(MovimientoInventario),
          useValue: movimientosRepository,
        },
        {
          provide: getRepositoryToken(PagoVenta),
          useValue: pagosRepository,
        },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
  });

  describe('Validación de Periodo y Fechas', () => {
    it('debe rechazar fechaDesde con mes/día imposible', async () => {
      await expect(
        service.resumen({ fechaDesde: '2026-99-01' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resumen({ fechaDesde: '2026-02-31' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar fechaHasta inválida', async () => {
      await expect(
        service.resumen({ fechaHasta: '2026-13-10' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar rango invertido (fechaDesde > fechaHasta)', async () => {
      await expect(
        service.resumen({
          fechaDesde: '2026-09-12',
          fechaHasta: '2026-09-10',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'fechaDesde no puede ser posterior a fechaHasta.',
        ),
      );
    });
  });

  describe('Dashboard Ejecutivo (9B)', () => {
    it('debe devolver resumen completo sin filtros de fecha', async () => {
      const resultado = await service.resumen({});

      expect(resultado).toEqual({
        periodo: {
          fechaDesde: null,
          fechaHasta: null,
        },
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
      });
    });
  });

  describe('Resumen Detallado de Ventas (9C)', () => {
    it('debe devolver resumen de ventas con subtotal, descuentos e IVA', async () => {
      const resultado = await service.resumenVentas({});

      expect(resultado).toEqual({
        periodo: {
          fechaDesde: null,
          fechaHasta: null,
        },
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
      });

      expect(ventasQueryBuilder.where).toHaveBeenCalledWith(
        'venta.estadoVenta <> :anulada',
        { anulada: 'ANULADA' },
      );
    });

    it('debe calcular margen 0 sin fallar cuando ventas es 0', async () => {
      jest.spyOn(ventasQueryBuilder, 'getRawOne').mockResolvedValueOnce({
        cantidadVentas: '0',
        subtotal: '0',
        descuentos: '0',
        iva: '0',
        ventas: '0',
        costo: '0',
        gananciaBruta: '0',
        montoPagado: '0',
        saldoPendiente: '0',
      });

      const res = await service.resumenVentas({});
      expect(res.ventas).toBe(0);
      expect(res.margenBrutoPorcentaje).toBe(0);
      expect(Number.isNaN(res.margenBrutoPorcentaje)).toBe(false);
    });
  });

  describe('Evolución de Ventas Diaria (9C)', () => {
    it('debe agrupar por fecha y calcular márgenes diarios independientes', async () => {
      const res = await service.evolucionVentas({});

      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        fecha: '2026-09-10',
        cantidadVentas: 1,
        ventas: 5000,
        costo: 3000,
        gananciaBruta: 2000,
        margenBrutoPorcentaje: 40,
      });
      expect(res[1]).toEqual({
        fecha: '2026-09-12',
        cantidadVentas: 6,
        ventas: 37500,
        costo: 26500,
        gananciaBruta: 11000,
        margenBrutoPorcentaje: 29.33,
      });

      expect(ventasQueryBuilder.orderBy).toHaveBeenCalledWith(
        'venta.fechaVenta',
        'ASC',
      );
    });
  });

  describe('Rentabilidad por Producto (9C)', () => {
    it('debe devolver rentabilidad por producto usando left join con categoría', async () => {
      const res = await service.ventasPorProducto({});

      expect(res).toHaveLength(3);
      expect(res[0]).toEqual({
        idProducto: 9,
        producto: 'Producto movimiento prueba',
        categoria: 'Sin categoría',
        unidadesVendidas: 5,
        ventas: 31000,
        costo: 22500,
        gananciaBruta: 8500,
        margenBrutoPorcentaje: 27.42,
      });

      expect(detallesQueryBuilder.innerJoin).toHaveBeenCalledWith(
        VentaEntity,
        'venta',
        expect.stringContaining('venta.idVenta'),
      );
      expect(detallesQueryBuilder.leftJoin).toHaveBeenCalledWith(
        Categoria,
        'categoria',
        expect.stringContaining('categoria.idCategoria'),
      );
    });
  });

  describe('Rentabilidad por Lote (9C)', () => {
    it('debe separar lotes distintos respetando costos históricos', async () => {
      jest.spyOn(detallesQueryBuilder, 'getRawMany').mockResolvedValueOnce([
        {
          idLote: '17',
          codigoLote: 'L2',
          idProducto: '9',
          producto: 'Producto movimiento prueba',
          unidadesVendidas: '5',
          ventas: '31000.00',
          costo: '22500.00',
          gananciaBruta: '8500.00',
        },
        {
          idLote: '13',
          codigoLote: 'L1',
          idProducto: '6',
          producto: 'Aceite recepción prueba',
          unidadesVendidas: '1',
          ventas: '6500.00',
          costo: '4000.00',
          gananciaBruta: '2500.00',
        },
      ]);

      const res = await service.ventasPorLote({});

      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        idLote: 17,
        codigoLote: 'L2',
        idProducto: 9,
        producto: 'Producto movimiento prueba',
        unidadesVendidas: 5,
        ventas: 31000,
        costo: 22500,
        gananciaBruta: 8500,
        margenBrutoPorcentaje: 27.42,
      });
      expect(res[1].idLote).toBe(13);
      expect(res[1].codigoLote).toBe('L1');
    });
  });

  describe('Reporte de Ventas Anuladas (9C)', () => {
    it('debe consultar exclusivamente ventas anuladas y mapear métricas históricas', async () => {
      const res = await service.ventasAnuladas({});

      expect(res).toEqual({
        periodo: {
          fechaDesde: null,
          fechaHasta: null,
        },
        cantidad: 7, // mock value
        importeOriginal: 142500,
        costoOriginal: 85500,
        gananciaOriginal: 57000,
        montoPagadoHistorico: 26500,
      });

      expect(ventasQueryBuilder.where).toHaveBeenCalledWith(
        'venta.estadoVenta = :anulada',
        { anulada: 'ANULADA' },
      );
    });
  });

  describe('Resumen de Inventario (9D)', () => {
    it('debe mapear strings SQL a números y calcular totales y estados', async () => {
      const res = await service.resumenInventario();

      expect(res).toEqual({
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
      });
    });

    it('debe responder con ceros y no nulls cuando no hay lotes', async () => {
      jest
        .spyOn(lotesQueryBuilder, 'getRawOne')
        .mockResolvedValueOnce(undefined);

      const res = await service.resumenInventario();

      expect(res).toEqual({
        totalLotes: 0,
        lotesConStock: 0,
        unidadesRecibidas: 0,
        unidadesDisponibles: 0,
        valorCosto: 0,
        estados: {
          agotados: 0,
          enProceso: 0,
          enStock: 0,
          vendidoParcial: 0,
        },
      });
    });
  });

  describe('Inventario por Producto (9D)', () => {
    it('debe incluir productos con y sin stock con Sin categoría por defecto', async () => {
      const res = await service.inventarioPorProducto();

      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        idProducto: 6,
        producto: 'Aceite recepción prueba',
        categoria: 'Sin categoría',
        lotes: 2,
        lotesConStock: 2,
        cantidadRecibida: 26,
        stockDisponible: 26,
        valorCosto: 104000,
      });
      expect(res[1]).toEqual({
        idProducto: 9,
        producto: 'Producto movimiento prueba',
        categoria: 'Sin categoría',
        lotes: 1,
        lotesConStock: 1,
        cantidadRecibida: 10,
        stockDisponible: 10,
        valorCosto: 40000,
      });
      expect(productosQueryBuilder.leftJoin).toHaveBeenCalledWith(
        LoteProducto,
        'lote',
        expect.stringContaining('lote.idProducto = producto.idProducto'),
      );
      expect(productosQueryBuilder.leftJoin).toHaveBeenCalledWith(
        Categoria,
        'categoria',
        expect.stringContaining('categoria.idCategoria = producto.idCategoria'),
      );
    });
  });

  describe('Inventario por Estado (9D)', () => {
    it('debe agrupar métricas por estado de lote', async () => {
      const res = await service.inventarioPorEstado();

      expect(res).toHaveLength(4);
      expect(res[0]).toEqual({
        estado: 'AGOTADO',
        lotes: 2,
        unidadesRecibidas: 6,
        unidadesDisponibles: 0,
        valorCostoDisponible: 0,
      });
      expect(res[2]).toEqual({
        estado: 'EN_STOCK',
        lotes: 9,
        unidadesRecibidas: 45,
        unidadesDisponibles: 45,
        valorCostoDisponible: 174000,
      });
    });
  });

  describe('Productos Sin Stock (9D)', () => {
    it('debe retornar solo productos cuyo stock total es 0', async () => {
      jest.spyOn(productosQueryBuilder, 'getRawMany').mockResolvedValueOnce([
        {
          idProducto: '1',
          producto: 'Casco Integral',
          cantidadRecibida: '0',
          stockDisponible: '0',
          lotesEnProceso: '1',
          lotesAgotados: '0',
        },
        {
          idProducto: '2',
          producto: 'Guantes Fox',
          cantidadRecibida: '6',
          stockDisponible: '0',
          lotesEnProceso: '0',
          lotesAgotados: '2',
        },
      ]);

      const res = await service.productosSinStock();

      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        idProducto: 1,
        producto: 'Casco Integral',
        cantidadRecibida: 0,
        stockDisponible: 0,
        lotesEnProceso: 1,
        lotesAgotados: 0,
      });
      expect(res[1]).toEqual({
        idProducto: 2,
        producto: 'Guantes Fox',
        cantidadRecibida: 6,
        stockDisponible: 0,
        lotesEnProceso: 0,
        lotesAgotados: 2,
      });
      expect(productosQueryBuilder.having).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE('),
      );
    });
  });

  describe('Histórico de Inventario y Reconstrucción por Eventos (9D)', () => {
    it('debe rechazar fechaCorte inválida en calendario (ej. 2026-02-31)', async () => {
      await expect(
        service.historicoInventario({ fechaCorte: '2026-02-31' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe manejar correctamente lotes completos, legacy e inconsistentes', async () => {
      jest.spyOn(lotesQueryBuilder, 'getRawMany').mockResolvedValueOnce([
        {
          idLote: '1',
          codigoLote: 'L1',
          idProducto: '6',
          producto: 'Aceite recepción prueba',
          cantidadRecibida: '10',
          stockActual: '7',
          costoUnitarioReal: '4000.00',
          entradasRegistradas: '10',
          stockLedgerAlCorte: '7',
        },
        {
          idLote: '2',
          codigoLote: 'L2',
          idProducto: '7',
          producto: 'Filtro recepción prueba',
          cantidadRecibida: '10',
          stockActual: '8',
          costoUnitarioReal: '2000.00',
          entradasRegistradas: '0', // legacy sin entradas
          stockLedgerAlCorte: '-2',
        },
        {
          idLote: '3',
          codigoLote: 'L3',
          idProducto: '8',
          producto: 'Bujía NGK prueba',
          cantidadRecibida: '10',
          stockActual: '5',
          costoUnitarioReal: '2500.00',
          entradasRegistradas: '5', // parcialmente migrado
          stockLedgerAlCorte: '5',
        },
        {
          idLote: '4',
          codigoLote: 'L4',
          idProducto: '9',
          producto: 'Producto movimiento prueba',
          cantidadRecibida: '10',
          stockActual: '0',
          costoUnitarioReal: '4000.00',
          entradasRegistradas: '10',
          stockLedgerAlCorte: '-1', // inconsistente negativo
        },
        {
          idLote: '5',
          codigoLote: 'L5',
          idProducto: '10',
          producto: 'Producto Concurrencia Lock',
          cantidadRecibida: '10',
          stockActual: '10',
          costoUnitarioReal: '3000.00',
          entradasRegistradas: '10',
          stockLedgerAlCorte: '11', // sobre-stock inconsistente
        },
      ]);

      const res = await service.historicoInventario({
        fechaCorte: '2026-09-12',
      });

      expect(res.fechaCorte).toBe('2026-09-12');
      expect(res.cobertura).toEqual({
        lotesTotales: 5,
        lotesConHistorialCompleto: 3, // L1, L4, L5
        lotesLegacy: 2, // L2 (0 entradas), L3 (5/10 entradas)
        coberturaCompleta: false,
        lotesInconsistentes: 2, // L4 (-1) y L5 (11)
      });

      // Lote 1: completo y consistente
      expect(res.lotes[0]).toEqual({
        idLote: 1,
        codigoLote: 'L1',
        idProducto: 6,
        producto: 'Aceite recepción prueba',
        cantidadRecibida: 10,
        entradasRegistradas: 10,
        historialCompleto: true,
        stockHistorico: 7,
        stockActual: 7,
        costoUnitarioReal: 4000,
        valorCostoHistorico: 28000,
        consistente: true,
      });

      // Lote 2: legacy (0 entradas) -> stockHistorico null, nunca negativo
      expect(res.lotes[1]).toEqual({
        idLote: 2,
        codigoLote: 'L2',
        idProducto: 7,
        producto: 'Filtro recepción prueba',
        cantidadRecibida: 10,
        entradasRegistradas: 0,
        historialCompleto: false,
        stockHistorico: null,
        stockActual: 8,
        costoUnitarioReal: 2000,
        valorCostoHistorico: null,
        consistente: null,
      });

      // Lote 3: parcialmente migrado (5/10) -> stockHistorico null
      expect(res.lotes[2].historialCompleto).toBe(false);
      expect(res.lotes[2].stockHistorico).toBeNull();
      expect(res.lotes[2].consistente).toBeNull();

      // Lote 4: inconsistente negativo (-1) -> no arroja 500, consistente false
      expect(res.lotes[3].historialCompleto).toBe(true);
      expect(res.lotes[3].stockHistorico).toBe(-1);
      expect(res.lotes[3].consistente).toBe(false);

      // Lote 5: sobre-stock (11 > 10) -> consistente false
      expect(res.lotes[4].historialCompleto).toBe(true);
      expect(res.lotes[4].stockHistorico).toBe(11);
      expect(res.lotes[4].consistente).toBe(false);

      // Reconstrucción: suma de los completos (L1=7, L4=-1, L5=11 -> 17)
      expect(res.reconstruccion.unidades).toBe(17);
      expect(res.reconstruccion.valorCosto).toBe(
        28000 + -1 * 4000 + 11 * 3000, // 28000 - 4000 + 33000 = 57000
      );

      // Parámetros de QueryBuilder: fechaHastaExclusiva = siguiente día
      expect(lotesQueryBuilder.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          entrada: 'ENTRADA_COMPRA',
          salida: 'SALIDA_VENTA',
          reingreso: 'REINGRESO_ANULACION_VENTA',
          fechaHastaExclusiva: '2026-09-13',
        }),
      );
    });

    it('debe calcular el siguiente día cruzando meses y años', async () => {
      // Test fin de mes (2026-09-30 -> 2026-10-01)
      await service.historicoInventario({ fechaCorte: '2026-09-30' });
      expect(lotesQueryBuilder.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          fechaHastaExclusiva: '2026-10-01',
        }),
      );

      // Test fin de año (2026-12-31 -> 2027-01-01)
      await service.historicoInventario({ fechaCorte: '2026-12-31' });
      expect(lotesQueryBuilder.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          fechaHastaExclusiva: '2027-01-01',
        }),
      );
    });
  });

  describe('Resumen de Compras (9E)', () => {
    it('debe calcular totales financieros y conciliar recepción y costos', async () => {
      jest.spyOn(lotesQueryBuilder, 'getRawOne').mockResolvedValueOnce({
        unidadesRecibidas: '61',
      });

      const res = await service.resumenCompras({});

      expect(res).toEqual({
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
      });

      expect(detallesPedidoQueryBuilder.where).toHaveBeenCalledWith(
        'pedido.estado <> :cancelado',
        { cancelado: 'CANCELADO' },
      );
    });

    it('debe detectar inconsistencia cuando costoReal difiere de la suma de componentes', async () => {
      jest
        .spyOn(detallesPedidoQueryBuilder, 'getRawOne')
        .mockResolvedValueOnce({
          cantidadPedidos: '1',
          unidadesPedidas: '10',
          unidadesPlaneadas: '0',
          mercaderiaColones: '100000.00',
          mercaderiaOriginal: '0.00',
          envio: '10000.00',
          impuestos: '5000.00',
          otrosGastos: '2000.00',
          costoReal: '118000.00', // 1000 más que 117000
          costoRealOriginal: '0.00',
        });

      jest.spyOn(lotesQueryBuilder, 'getRawOne').mockResolvedValueOnce({
        unidadesRecibidas: '10',
      });

      const res = await service.resumenCompras({});

      expect(res.costoReal).toBe(118000);
      expect(res.diferenciaCosto).toBe(1000);
      expect(res.costoConsistente).toBe(false);
    });

    it('debe detectar sobre-recepción (recibidas > pedidas) y no devolver pendientes negativos', async () => {
      jest
        .spyOn(detallesPedidoQueryBuilder, 'getRawOne')
        .mockResolvedValueOnce({
          cantidadPedidos: '1',
          unidadesPedidas: '10',
          unidadesPlaneadas: '0',
          mercaderiaColones: '50000.00',
          mercaderiaOriginal: '0.00',
          envio: '0.00',
          impuestos: '0.00',
          otrosGastos: '0.00',
          costoReal: '50000.00',
          costoRealOriginal: '0.00',
        });

      jest.spyOn(lotesQueryBuilder, 'getRawOne').mockResolvedValueOnce({
        unidadesRecibidas: '12', // 12 > 10
      });

      const res = await service.resumenCompras({});

      expect(res.unidadesPedidas).toBe(10);
      expect(res.unidadesRecibidas).toBe(12);
      expect(res.unidadesPendientes).toBe(0);
      expect(res.recepcionConsistente).toBe(false);
    });
  });

  describe('Evolución de Compras (9E)', () => {
    it('debe agrupar por pedido.fechaPedido y ordenar cronológicamente', async () => {
      const res = await service.evolucionCompras({});

      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({
        fecha: '2026-09-10',
        pedidos: 2,
        unidadesPedidas: 20,
        mercaderiaColones: 50000,
        envio: 5000,
        impuestos: 2500,
        otrosGastos: 1000,
        costoReal: 58500,
      });

      expect(detallesPedidoQueryBuilder.groupBy).toHaveBeenCalledWith(
        'pedido.fechaPedido',
      );
      expect(detallesPedidoQueryBuilder.orderBy).toHaveBeenCalledWith(
        'pedido.fechaPedido',
        'ASC',
      );
    });
  });

  describe('Compras por Proveedor (9E)', () => {
    it('debe agrupar compras por proveedor respetando proveedores sin categoría/inactivos', async () => {
      const res = await service.comprasPorProveedor({});

      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({
        idProveedor: 1,
        proveedor: 'Proveedor Central',
        pedidos: 2,
        unidadesPedidas: 20,
        mercaderiaColones: 50000,
        costosAdicionales: 8500,
        costoReal: 58500,
      });

      expect(detallesPedidoQueryBuilder.leftJoin).toHaveBeenCalledWith(
        OrigenCompra,
        'proveedor',
        expect.stringContaining(
          'proveedor.idOrigenCompra = pedido.idOrigenCompra',
        ),
      );
    });
  });

  describe('Compras por Producto (9E)', () => {
    it('debe agregar compras a nivel de producto y manejar Sin categoría', async () => {
      const res = await service.comprasPorProducto({});

      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({
        idProducto: 6,
        producto: 'Aceite recepción prueba',
        categoria: 'Sin categoría',
        pedidos: 2,
        unidadesPedidas: 20,
        mercaderiaColones: 50000,
        envio: 5000,
        impuestos: 2500,
        otrosGastos: 1000,
        costoReal: 58500,
      });

      expect(detallesPedidoQueryBuilder.innerJoin).toHaveBeenCalledWith(
        Producto,
        'producto',
        expect.stringContaining('producto.idProducto = detalle.idProducto'),
      );
    });
  });

  describe('Composición de Costos de Compras (9E)', () => {
    it('debe calcular porcentajes y consistencia de componentes', async () => {
      const res = await service.composicionCostosCompras({});

      expect(res).toEqual({
        mercaderia: {
          monto: 300000,
          porcentaje: 88.24,
        },
        envio: {
          monto: 20000,
          porcentaje: 5.88,
        },
        impuestos: {
          monto: 15000,
          porcentaje: 4.41,
        },
        otrosGastos: {
          monto: 5000,
          porcentaje: 1.47,
        },
        costoReal: 340000,
        diferencia: 0,
        consistente: true,
      });
    });

    it('debe devolver ceros cuando costoReal es 0 sin provocar NaN', async () => {
      jest
        .spyOn(detallesPedidoQueryBuilder, 'getRawOne')
        .mockResolvedValueOnce({
          cantidadPedidos: '0',
          unidadesPedidas: '0',
          unidadesPlaneadas: '0',
          mercaderiaColones: '0.00',
          mercaderiaOriginal: '0.00',
          envio: '0.00',
          impuestos: '0.00',
          otrosGastos: '0.00',
          costoReal: '0.00',
          costoRealOriginal: '0.00',
        });

      const res = await service.composicionCostosCompras({});

      expect(res).toEqual({
        mercaderia: { monto: 0, porcentaje: 0 },
        envio: { monto: 0, porcentaje: 0 },
        impuestos: { monto: 0, porcentaje: 0 },
        otrosGastos: { monto: 0, porcentaje: 0 },
        costoReal: 0,
        diferencia: 0,
        consistente: true,
      });
    });
  });

  describe('Compras Canceladas (9E)', () => {
    it('debe consultar exclusivamente pedidos cancelados con importes originales', async () => {
      const res = await service.comprasCanceladas({});

      expect(res).toEqual({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadPedidos: 19, // mock raw
        unidadesPlaneadas: 25,
        mercaderiaOriginal: 75000,
        costoRealOriginal: 82000,
      });

      expect(detallesPedidoQueryBuilder.where).toHaveBeenCalledWith(
        'pedido.estado = :cancelado',
        { cancelado: 'CANCELADO' },
      );
    });
  });

  describe('Periodo Datetime (9F)', () => {
    it('debe aplicar fechaDesdeDatetime con T00:00:00.000', async () => {
      await service.resumenPagos({ fechaDesde: '2026-09-12' });

      expect(pagosQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pago.createdAt >= :fechaDesdeDatetime',
        { fechaDesdeDatetime: '2026-09-12T00:00:00.000' },
      );
    });

    it('debe aplicar fechaHastaExclusiva con T00:00:00.000 del día siguiente', async () => {
      await service.resumenPagos({ fechaHasta: '2026-09-12' });

      expect(pagosQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pago.createdAt < :fechaHastaExclusiva',
        { fechaHastaExclusiva: '2026-09-13T00:00:00.000' },
      );
    });

    it('debe calcular límite superior exclusivo para fin de mes (2026-09-30 -> 2026-10-01)', async () => {
      await service.resumenPagos({ fechaHasta: '2026-09-30' });

      expect(pagosQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pago.createdAt < :fechaHastaExclusiva',
        { fechaHastaExclusiva: '2026-10-01T00:00:00.000' },
      );
    });

    it('debe calcular límite superior exclusivo para fin de año (2026-12-31 -> 2027-01-01)', async () => {
      await service.resumenPagos({ fechaHasta: '2026-12-31' });

      expect(pagosQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pago.createdAt < :fechaHastaExclusiva',
        { fechaHastaExclusiva: '2027-01-01T00:00:00.000' },
      );
    });
  });

  describe('Resumen de Pagos (9F)', () => {
    it('debe retornar resumen de pagos separando activas de anuladas y cuadrando la suma', async () => {
      (pagosQueryBuilder.getRawOne as jest.Mock).mockResolvedValueOnce({
        cantidadPagos: '10',
        ventasConPago: '6',
        montoRegistrado: '50000.00',
        montoVentasActivas: '30000.00',
        montoVentasAnuladas: '20000.00',
      });

      const res = await service.resumenPagos({});

      expect(res).toEqual({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadPagos: 10,
        ventasConPago: 6,
        montoRegistrado: 50000,
        montoVentasActivas: 30000,
        montoVentasAnuladas: 20000,
      });

      expect(res.montoRegistrado).toBe(
        res.montoVentasActivas + res.montoVentasAnuladas,
      );
    });

    it('debe manejar cero pagos sin devolver valores nulos', async () => {
      (pagosQueryBuilder.getRawOne as jest.Mock).mockResolvedValueOnce({
        cantidadPagos: '0',
        ventasConPago: '0',
        montoRegistrado: '0',
        montoVentasActivas: '0',
        montoVentasAnuladas: '0',
      });

      const res = await service.resumenPagos({});

      expect(res).toEqual({
        periodo: { fechaDesde: null, fechaHasta: null },
        cantidadPagos: 0,
        ventasConPago: 0,
        montoRegistrado: 0,
        montoVentasActivas: 0,
        montoVentasAnuladas: 0,
      });
    });
  });

  describe('Pagos por Método (9F)', () => {
    it('debe retornar desglose de métodos con totales activos y anulados ordenados por montoTotal DESC', async () => {
      (pagosQueryBuilder.getRawMany as jest.Mock).mockResolvedValueOnce([
        {
          metodoPago: 'SINPE',
          pagos: '3',
          montoTotal: '16500.00',
          montoVentasActivas: '16500.00',
          montoVentasAnuladas: '0.00',
        },
        {
          metodoPago: 'TARJETA',
          pagos: '2',
          montoTotal: '10000.00',
          montoVentasActivas: '6500.00',
          montoVentasAnuladas: '3500.00',
        },
      ]);

      const res = await service.pagosPorMetodo({});

      expect(res).toEqual([
        {
          metodoPago: 'SINPE',
          pagos: 3,
          montoTotal: 16500,
          montoVentasActivas: 16500,
          montoVentasAnuladas: 0,
        },
        {
          metodoPago: 'TARJETA',
          pagos: 2,
          montoTotal: 10000,
          montoVentasActivas: 6500,
          montoVentasAnuladas: 3500,
        },
      ]);

      expect(pagosQueryBuilder.groupBy).toHaveBeenCalledWith('pago.metodoPago');
      expect(pagosQueryBuilder.orderBy).toHaveBeenCalledWith(
        'SUM(pago.monto)',
        'DESC',
      );
      expect(pagosQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'pago.metodoPago',
        'ASC',
      );
    });
  });

  describe('Evolución de Pagos (9F)', () => {
    it('debe agrupar por createdAt del pago y conservar pagos de anuladas', async () => {
      (pagosQueryBuilder.getRawMany as jest.Mock).mockResolvedValueOnce([
        {
          fecha: '2026-09-10',
          pagos: '2',
          montoTotal: '10000.00',
          montoVentasActivas: '8000.00',
          montoVentasAnuladas: '2000.00',
        },
        {
          fecha: '2026-09-12',
          pagos: '4',
          montoTotal: '17500.00',
          montoVentasActivas: '17500.00',
          montoVentasAnuladas: '0.00',
        },
      ]);

      const res = await service.evolucionPagos({});

      expect(res).toEqual([
        {
          fecha: '2026-09-10',
          pagos: 2,
          montoTotal: 10000,
          montoVentasActivas: 8000,
          montoVentasAnuladas: 2000,
        },
        {
          fecha: '2026-09-12',
          pagos: 4,
          montoTotal: 17500,
          montoVentasActivas: 17500,
          montoVentasAnuladas: 0,
        },
      ]);

      expect(pagosQueryBuilder.select).toHaveBeenCalledWith(
        'CAST(pago.createdAt AS date)',
        'fecha',
      );
      expect(pagosQueryBuilder.groupBy).toHaveBeenCalledWith(
        'CAST(pago.createdAt AS date)',
      );
    });
  });

  describe('Conciliación de Pagos (9F)', () => {
    it('debe clasificar ventas en CONCILIADA, HISTORIAL_INCOMPLETO e INCONSISTENTE_EXCESO_LEDGER', async () => {
      (ventasQueryBuilder.getRawMany as jest.Mock).mockResolvedValueOnce([
        {
          idVenta: '1',
          numeroVenta: 'V-001',
          fechaVenta: '2026-09-10',
          totalVenta: '5000.00',
          montoPagadoVenta: '5000.00',
          saldoPendiente: '0.00',
          cantidadPagosLedger: '1',
          montoLedger: '5000.00',
        },
        {
          idVenta: '2',
          numeroVenta: 'V-002',
          fechaVenta: '2026-09-10',
          totalVenta: '5000.00',
          montoPagadoVenta: '5000.00',
          saldoPendiente: '0.00',
          cantidadPagosLedger: '0',
          montoLedger: '0.00',
        },
        {
          idVenta: '3',
          numeroVenta: 'V-003',
          fechaVenta: '2026-09-11',
          totalVenta: '8000.00',
          montoPagadoVenta: '8000.00',
          saldoPendiente: '0.00',
          cantidadPagosLedger: '1',
          montoLedger: '3000.00',
        },
        {
          idVenta: '4',
          numeroVenta: 'V-004',
          fechaVenta: '2026-09-12',
          totalVenta: '5000.00',
          montoPagadoVenta: '5000.00',
          saldoPendiente: '0.00',
          cantidadPagosLedger: '2',
          montoLedger: '6000.00',
        },
        {
          idVenta: '5',
          numeroVenta: 'V-005',
          fechaVenta: '2026-09-12',
          totalVenta: '10000.00',
          montoPagadoVenta: '0.00',
          saldoPendiente: '10000.00',
          cantidadPagosLedger: '0',
          montoLedger: '0.00',
        },
      ]);

      const res = await service.conciliacionPagos();

      expect(res.resumen).toEqual({
        ventasActivas: 5,
        conciliadas: 2, // V-001 (5000=5000) y V-005 (0=0)
        historialIncompleto: 2, // V-002 (5000>0) y V-003 (8000>3000)
        inconsistentes: 1, // V-004 (5000<6000)
        montoPagadoVenta: 23000,
        montoLedger: 14000,
        diferenciaCobertura: 9000,
      });

      expect(res.detalle[0].estado).toBe('CONCILIADA');
      expect(res.detalle[1].estado).toBe('HISTORIAL_INCOMPLETO');
      expect(res.detalle[1].diferencia).toBe(5000);
      expect(res.detalle[2].estado).toBe('HISTORIAL_INCOMPLETO');
      expect(res.detalle[2].diferencia).toBe(5000);
      expect(res.detalle[3].estado).toBe('INCONSISTENTE_EXCESO_LEDGER');
      expect(res.detalle[3].diferencia).toBe(-1000);
      expect(res.detalle[4].estado).toBe('CONCILIADA');

      expect(ventasQueryBuilder.where).toHaveBeenCalledWith(
        'venta.estadoVenta <> :anulada',
        { anulada: 'ANULADA' },
      );
    });
  });

  describe('Cuentas por Cobrar (9F)', () => {
    it('debe listar ventas activas con saldo y asignar fallback mostrador', async () => {
      (ventasQueryBuilder.getRawMany as jest.Mock).mockResolvedValueOnce([
        {
          idVenta: '2103',
          numeroVenta: 'V-2103',
          fechaVenta: '2026-09-10',
          clienteNombre: null,
          estadoPago: 'PARCIAL',
          totalVenta: '5000.00',
          montoPagado: '3500.00',
          saldoPendiente: '1500.00',
          fechaVencimientoPago: null,
        },
        {
          idVenta: '1554',
          numeroVenta: 'V-1554',
          fechaVenta: '2026-09-11',
          clienteNombre: '   ',
          estadoPago: 'PARCIAL',
          totalVenta: '5000.00',
          montoPagado: '3000.00',
          saldoPendiente: '2000.00',
          fechaVencimientoPago: null,
        },
        {
          idVenta: '699897',
          numeroVenta: 'V-699897',
          fechaVenta: '2026-09-12',
          clienteNombre: 'Cliente Con Deuda',
          estadoPago: 'EN_DEUDA',
          totalVenta: '6500.00',
          montoPagado: '0.00',
          saldoPendiente: '6500.00',
          fechaVencimientoPago: '2026-09-20',
        },
      ]);

      const res = await service.cuentasPorCobrar();

      expect(res.resumen).toEqual({
        ventasConSaldo: 3,
        totalPorCobrar: 10000,
      });

      expect(res.detalle[0].cliente).toBe('Venta mostrador');
      expect(res.detalle[1].cliente).toBe('Venta mostrador');
      expect(res.detalle[2].cliente).toBe('Cliente Con Deuda');
      expect(res.detalle[2].fechaVencimientoPago).toBe('2026-09-20');

      expect(ventasQueryBuilder.where).toHaveBeenCalledWith(
        'venta.estadoVenta <> :anulada',
        { anulada: 'ANULADA' },
      );
      expect(ventasQueryBuilder.andWhere).toHaveBeenCalledWith(
        'venta.saldoPendiente > 0',
      );
    });
  });

  describe('Vencimientos de Cuentas por Cobrar (9F)', () => {
    it('debe rechazar fechaCorte ausente o inválida', async () => {
      await expect(
        service.vencimientosCuentasPorCobrar({ fechaCorte: '' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.vencimientosCuentasPorCobrar({ fechaCorte: '2026-02-31' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe retornar los 4 buckets de vencimiento cuadrando con las ventas con saldo', async () => {
      (ventasQueryBuilder.getRawOne as jest.Mock).mockResolvedValueOnce({
        sinVencimientoCantidad: '3',
        sinVencimientoSaldo: '10000.00',
        vencidasCantidad: '0',
        vencidasSaldo: '0.00',
        venceHoyCantidad: '0',
        venceHoySaldo: '0.00',
        porVencerCantidad: '0',
        porVencerSaldo: '0.00',
      });

      const res = await service.vencimientosCuentasPorCobrar({
        fechaCorte: '2026-09-12',
      });

      expect(res).toEqual({
        fechaCorte: '2026-09-12',
        sinVencimiento: { cantidad: 3, saldo: 10000 },
        vencidas: { cantidad: 0, saldo: 0 },
        venceEnFechaCorte: { cantidad: 0, saldo: 0 },
        porVencer: { cantidad: 0, saldo: 0 },
      });

      const totalCantidad =
        res.sinVencimiento.cantidad +
        res.vencidas.cantidad +
        res.venceEnFechaCorte.cantidad +
        res.porVencer.cantidad;

      const totalSaldo =
        res.sinVencimiento.saldo +
        res.vencidas.saldo +
        res.venceEnFechaCorte.saldo +
        res.porVencer.saldo;

      expect(totalCantidad).toBe(3);
      expect(totalSaldo).toBe(10000);
    });
  });
});
