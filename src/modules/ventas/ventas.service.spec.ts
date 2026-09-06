import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { VentaEntity } from '../../database/entities/venta.entity';
import { InventarioService } from '../inventario/inventario.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { VentasService } from './ventas.service';

interface MockQueryBuilder {
  setLock: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  getOne: jest.Mock;
  getMany: jest.Mock;
}

describe('VentasService', () => {
  let service: VentasService;
  let ventasRepository: jest.Mocked<Repository<VentaEntity>>;
  let inventarioService: { registrarMovimiento: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: jest.Mocked<EntityManager>;
  let managerSaveMock: jest.Mock;

  const crearQueryBuilderMock = (): MockQueryBuilder => {
    const qb: MockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };
    return qb;
  };

  const crearVenta = (overrides: Partial<VentaEntity> = {}): VentaEntity => ({
    idVenta: 100,
    numeroVenta: 1001,
    fechaVenta: '2026-09-10',
    clienteNombre: 'Cliente Test',
    medioPago: 'EFECTIVO',
    estadoPago: 'PAGADA',
    estadoVenta: 'REGISTRADA',
    subtotal: 13000,
    descuentoTotal: 0,
    ivaTotal: 0,
    totalVenta: 13000,
    montoPagado: 13000,
    saldoPendiente: 0,
    costoTotal: 8000,
    gananciaBruta: 5000,
    margenBruto: 38.46,
    fechaEntrega: '2026-09-10',
    fechaVencimientoPago: null,
    observaciones: null,
    enPapelera: false,
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-10'),
    detalles: [],
    ...overrides,
  });

  const crearLote = (overrides: Partial<LoteProducto> = {}): LoteProducto => ({
    idLote: 13,
    idPedido: 1,
    idProducto: 6,
    idDetallePedido: 1,
    codigoLote: 'L1',
    cantidadInicial: 10,
    cantidadRecibida: 10,
    cantidadDisponible: 10,
    costoUnitarioReal: 4000,
    precioVentaRecomendado: 6500,
    estadoLote: 'EN_STOCK',
    fechaEntrada: '2026-09-10',
    precioVentaFinal: null,
    tipoLote: 'NORMAL',
    costoPendienteAlVender: false,
    observaciones: null,
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-10'),
    ...overrides,
  });

  beforeEach(async () => {
    managerSaveMock = jest.fn((_entityClass: unknown, entity: unknown) => {
      if (entity && typeof entity === 'object' && 'numeroVenta' in entity) {
        return Promise.resolve({ idVenta: 100, ...entity } as VentaEntity);
      }
      if (entity && typeof entity === 'object' && 'idProducto' in entity) {
        return Promise.resolve({ idDetalleVenta: 200, ...entity });
      }
      return Promise.resolve(entity);
    });

    manager = {
      create: jest.fn((_entityClass: unknown, plain: unknown) => plain),
      save: managerSaveMock,
      findOne: jest.fn(),
      find: jest.fn(),
      query: jest.fn(),
      getRepository: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    dataSource = {
      transaction: jest.fn(
        <T>(callback: (em: EntityManager) => Promise<T>): Promise<T> => {
          return callback(manager);
        },
      ),
    };

    ventasRepository = {
      findOne: jest.fn((options?: { where?: Record<string, unknown> }) => {
        if (options?.where && 'numeroVenta' in options.where) {
          return Promise.resolve(null);
        }
        if (options?.where && 'idVenta' in options.where) {
          return Promise.resolve(crearVenta());
        }
        return Promise.resolve(null);
      }),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<VentaEntity>>;

    inventarioService = {
      registrarMovimiento: jest.fn().mockResolvedValue({ idMovimiento: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(VentaEntity),
          useValue: ventasRepository,
        },
        {
          provide: InventarioService,
          useValue: inventarioService,
        },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Modo MANUAL con bloqueo pesimista', () => {
    it('debe solicitar bloqueo pessimistic_write y descontar stock suficiente', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      const dto: CreateVentaDto = {
        numeroVenta: 1001,
        fechaVenta: '2026-09-10',
        clienteNombre: 'Cliente Manual',
        medioPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 6,
            loteId: 13,
            cantidad: 2,
            precioUnitario: 6500,
            descuento: 0,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'MANUAL',
          },
        ],
      };

      const resultado = await service.create(dto);

      expect(qbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(loteMock.cantidadDisponible).toBe(3);
      expect(loteMock.estadoLote).toBe('VENDIDO_PARCIAL');
      expect(managerSaveMock).toHaveBeenCalledWith(LoteProducto, loteMock);
      expect(inventarioService.registrarMovimiento).toHaveBeenCalledWith(
        manager,
        expect.objectContaining({
          lote: loteMock,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 2,
          referenciaId: 100,
        }),
      );
      expect(resultado.id).toBe(100);
    });

    it('debe cambiar estadoLote a AGOTADO si cantidadDisponible llega a 0', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 2,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      const dto: CreateVentaDto = {
        numeroVenta: 1002,
        fechaVenta: '2026-09-10',
        medioPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 6,
            loteId: 13,
            cantidad: 2,
            precioUnitario: 6500,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'MANUAL',
          },
        ],
      };

      await service.create(dto);

      expect(loteMock.cantidadDisponible).toBe(0);
      expect(loteMock.estadoLote).toBe('AGOTADO');
    });

    it('debe lanzar BadRequestException en sobreventa y no registrar movimientos', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 2,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      const dto: CreateVentaDto = {
        numeroVenta: 1003,
        fechaVenta: '2026-09-10',
        medioPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 6,
            loteId: 13,
            cantidad: 3,
            precioUnitario: 6500,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'MANUAL',
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(inventarioService.registrarMovimiento).not.toHaveBeenCalled();
    });
  });

  describe('create - Modo FIFO con múltiples lotes', () => {
    it('debe solicitar bloqueo pessimistic_write y repartir venta entre lotes en orden fechaEntrada ASC, idLote ASC', async () => {
      const lote1 = crearLote({
        idLote: 16,
        idProducto: 9,
        codigoLote: 'L1',
        cantidadRecibida: 3,
        cantidadDisponible: 3,
        costoUnitarioReal: 1000,
        estadoLote: 'EN_STOCK',
        fechaEntrada: '2026-09-07',
      });

      const lote2 = crearLote({
        idLote: 17,
        idProducto: 9,
        codigoLote: 'L2',
        cantidadRecibida: 5,
        cantidadDisponible: 5,
        costoUnitarioReal: 1200,
        estadoLote: 'EN_STOCK',
        fechaEntrada: '2026-09-10',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getMany.mockResolvedValue([lote1, lote2]);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      const dto: CreateVentaDto = {
        numeroVenta: 1004,
        fechaVenta: '2026-09-11',
        medioPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 9,
            cantidad: 6,
            precioUnitario: 2000,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'FIFO',
          },
        ],
      };

      await service.create(dto);

      expect(qbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(lote1.cantidadDisponible).toBe(0);
      expect(lote1.estadoLote).toBe('AGOTADO');
      expect(lote2.cantidadDisponible).toBe(2);
      expect(lote2.estadoLote).toBe('VENDIDO_PARCIAL');

      expect(inventarioService.registrarMovimiento).toHaveBeenCalledTimes(2);

      expect(inventarioService.registrarMovimiento).toHaveBeenNthCalledWith(
        1,
        manager,
        expect.objectContaining({
          lote: lote1,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 3,
          referenciaId: 100,
        }),
      );

      expect(inventarioService.registrarMovimiento).toHaveBeenNthCalledWith(
        2,
        manager,
        expect.objectContaining({
          lote: lote2,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 3,
          referenciaId: 100,
        }),
      );
    });

    it('debe lanzar BadRequestException si el stock total de los lotes FIFO es insuficiente', async () => {
      const lote1 = crearLote({
        idLote: 1,
        idProducto: 9,
        cantidadDisponible: 2,
        costoUnitarioReal: 1000,
        estadoLote: 'EN_STOCK',
      });
      const lote2 = crearLote({
        idLote: 2,
        idProducto: 9,
        cantidadDisponible: 1,
        costoUnitarioReal: 1200,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getMany.mockResolvedValue([lote1, lote2]);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      const dto: CreateVentaDto = {
        numeroVenta: 1005,
        fechaVenta: '2026-09-11',
        medioPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 9,
            cantidad: 4,
            precioUnitario: 2000,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'FIFO',
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('create - Manejo de errores y transaccionalidad', () => {
    it('debe propagar error si inventarioService.registrarMovimiento falla', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
        costoUnitarioReal: 4000,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      inventarioService.registrarMovimiento.mockRejectedValue(
        new Error('Fallo simulado en movimiento'),
      );

      const dto: CreateVentaDto = {
        numeroVenta: 1006,
        fechaVenta: '2026-09-10',
        medioPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 6,
            loteId: 13,
            cantidad: 1,
            precioUnitario: 6500,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'MANUAL',
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(
        'Fallo simulado en movimiento',
      );
    });

    it('debe rechazar venta si montoPagado es mayor a totalVenta', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
        costoUnitarioReal: 4000,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      } as unknown as Repository<LoteProducto>);

      const dto: CreateVentaDto = {
        numeroVenta: 1007,
        fechaVenta: '2026-09-10',
        medioPago: 'EFECTIVO',
        montoPagado: 20000,
        detalles: [
          {
            productoId: 6,
            loteId: 13,
            cantidad: 1,
            precioUnitario: 6500,
            tipoTarifa: 'EXENTO',
            modoDescuentoLote: 'MANUAL',
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(
        'El monto pagado no puede ser mayor al total de la venta.',
      );
    });

    it('debe rechazar venta si ya existe el numeroVenta', async () => {
      ventasRepository.findOne.mockResolvedValueOnce(
        crearVenta({ numeroVenta: 1001 }),
      );

      const dto: CreateVentaDto = {
        numeroVenta: 1001,
        fechaVenta: '2026-09-10',
        medioPago: 'EFECTIVO',
        detalles: [],
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
