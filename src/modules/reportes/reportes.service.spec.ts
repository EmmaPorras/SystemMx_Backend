import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { VentaEntity } from '../../database/entities/venta.entity';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let service: ReportesService;
  let ventasRepository: jest.Mocked<Partial<Repository<VentaEntity>>>;
  let lotesRepository: jest.Mocked<Partial<Repository<LoteProducto>>>;
  let pedidosRepository: jest.Mocked<Partial<Repository<PedidoCompraEntity>>>;

  let ventasQueryBuilder: Partial<SelectQueryBuilder<VentaEntity>>;
  let lotesQueryBuilder: Partial<SelectQueryBuilder<LoteProducto>>;
  let pedidosQueryBuilder: Partial<SelectQueryBuilder<PedidoCompraEntity>>;

  beforeEach(async () => {
    ventasQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        cantidad: '7',
        total: '42500.00',
        costo: '29500.00',
        gananciaBruta: '13000.00',
        montoPagado: '32500.00',
        saldoPendiente: '10000.00',
        ventasConSaldo: '3',
        saldo: '10000.00',
      }),
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

    lotesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(lotesQueryBuilder),
    };

    pedidosRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(pedidosQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: getRepositoryToken(VentaEntity),
          useValue: ventasRepository,
        },
        {
          provide: getRepositoryToken(LoteProducto),
          useValue: lotesRepository,
        },
        {
          provide: getRepositoryToken(PedidoCompraEntity),
          useValue: pedidosRepository,
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

  describe('Cálculo y Mapeo del Resumen Ejecutivo', () => {
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

      expect(ventasQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('fechaVenta >='),
        expect.anything(),
      );
      expect(pedidosQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('fechaPedido >='),
        expect.anything(),
      );
    });

    it('debe aplicar filtros de periodo a ventas y pedidos pero NO a inventario ni cuentas por cobrar', async () => {
      const dto = {
        fechaDesde: '2026-09-01',
        fechaHasta: '2026-09-12',
      };

      const resultado = await service.resumen(dto);

      expect(resultado.periodo).toEqual({
        fechaDesde: '2026-09-01',
        fechaHasta: '2026-09-12',
      });

      expect(ventasQueryBuilder.andWhere).toHaveBeenCalledWith(
        'venta.fechaVenta >= :fechaDesde',
        { fechaDesde: '2026-09-01' },
      );
      expect(ventasQueryBuilder.andWhere).toHaveBeenCalledWith(
        'venta.fechaVenta <= :fechaHasta',
        { fechaHasta: '2026-09-12' },
      );

      expect(pedidosQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pedido.fechaPedido >= :fechaDesde',
        { fechaDesde: '2026-09-01' },
      );
      expect(pedidosQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pedido.fechaPedido <= :fechaHasta',
        { fechaHasta: '2026-09-12' },
      );

      // Inventario y cuentas por cobrar deben conservar queries de snapshot sin filtros de fecha
      expect(lotesQueryBuilder.where).toHaveBeenCalledWith(
        'lote.cantidadDisponible > 0',
      );
    });

    it('debe excluir ventas anuladas del resumen comercial', async () => {
      await service.resumen({});

      expect(ventasQueryBuilder.where).toHaveBeenCalledWith(
        'venta.estadoVenta <> :anulada',
        { anulada: 'ANULADA' },
      );
    });

    it('debe calcular margen 0 sin NaN ni Infinity cuando total es 0', async () => {
      jest.spyOn(ventasQueryBuilder, 'getRawOne').mockResolvedValueOnce({
        cantidad: '0',
        total: '0.00',
        costo: '0.00',
        gananciaBruta: '0.00',
        montoPagado: '0.00',
        saldoPendiente: '0.00',
      });

      const resultado = await service.resumen({});

      expect(resultado.ventas.total).toBe(0);
      expect(resultado.ventas.margenBrutoPorcentaje).toBe(0);
      expect(Number.isNaN(resultado.ventas.margenBrutoPorcentaje)).toBe(false);
      expect(Number.isFinite(resultado.ventas.margenBrutoPorcentaje)).toBe(
        true,
      );
    });

    it('debe convertir correctamente tipos string de SQL a number en todas las métricas', async () => {
      jest
        .spyOn(ventasQueryBuilder, 'getRawOne')
        .mockResolvedValueOnce({
          cantidad: '2',
          total: '10000.50',
          costo: '7000.25',
          gananciaBruta: '3000.25',
          montoPagado: '5000.00',
          saldoPendiente: '5000.50',
        })
        .mockResolvedValueOnce({
          ventasConSaldo: '1',
          saldo: '5000.50',
        });

      jest.spyOn(lotesQueryBuilder, 'getRawOne').mockResolvedValueOnce({
        lotesConStock: '5',
        unidadesDisponibles: '20',
        valorCosto: '15000.75',
      });

      const resultado = await service.resumen({});

      expect(typeof resultado.ventas.cantidad).toBe('number');
      expect(typeof resultado.ventas.total).toBe('number');
      expect(typeof resultado.inventario.valorCosto).toBe('number');
      expect(typeof resultado.cuentasPorCobrar.saldo).toBe('number');
      expect(resultado.ventas.total).toBe(10000.5);
      expect(resultado.inventario.valorCosto).toBe(15000.75);
    });

    it('debe manejar estados de pedidos ausentes asignando 0', async () => {
      jest.spyOn(pedidosQueryBuilder, 'getRawMany').mockResolvedValueOnce([
        { estado: 'REGISTRADO', cantidad: '3' },
        { estado: 'RECIBIDO', cantidad: '2' },
      ]);

      const resultado = await service.resumen({});

      expect(resultado.pedidos).toEqual({
        registrados: 3,
        enTransito: 0,
        recibidos: 2,
        cancelados: 0,
        pendientes: 3,
        total: 5,
      });
    });
  });
});
