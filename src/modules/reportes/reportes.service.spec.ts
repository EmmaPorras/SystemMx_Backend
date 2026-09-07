import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
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
  let productosRepository: jest.Mocked<Partial<Repository<Producto>>>;
  let categoriasRepository: jest.Mocked<Partial<Repository<Categoria>>>;

  let ventasQueryBuilder: Partial<SelectQueryBuilder<VentaEntity>>;
  let detallesQueryBuilder: Partial<SelectQueryBuilder<DetalleVenta>>;
  let lotesQueryBuilder: Partial<SelectQueryBuilder<LoteProducto>>;
  let pedidosQueryBuilder: Partial<SelectQueryBuilder<PedidoCompraEntity>>;

  beforeEach(async () => {
    ventasQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
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
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        lotesConStock: '10',
        unidadesDisponibles: '54',
        valorCosto: '204000.00',
      }),
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

    productosRepository = {
      createQueryBuilder: jest.fn(),
    };

    categoriasRepository = {
      createQueryBuilder: jest.fn(),
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
          provide: getRepositoryToken(Producto),
          useValue: productosRepository,
        },
        {
          provide: getRepositoryToken(Categoria),
          useValue: categoriasRepository,
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
});
