import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PagoVenta } from '../../database/entities/pago-venta.entity';
import { Producto } from '../../database/entities/producto.entity';
import { VentaEntity } from '../../database/entities/venta.entity';
import { InventarioService } from '../inventario/inventario.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { RegistrarPagoVentaDto } from './dto/registrar-pago-venta.dto';
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
  let pagosRepository: jest.Mocked<Repository<PagoVenta>>;
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
    pagos: [],
    ...overrides,
  });

  const crearDetalleVenta = (
    overrides: Partial<DetalleVenta> = {},
  ): DetalleVenta => ({
    idDetalleVenta: 201,
    idVenta: 100,
    idProducto: 6,
    idLote: 13,
    cantidad: 2,
    precioUnitario: 6500,
    subtotal: 13000,
    descuento: 0,
    baseImponible: 13000,
    tipoTarifa: 'EXENTO',
    idTarifaIva: null,
    porcentajeIva: 0,
    iva: 0,
    totalLinea: 13000,
    costoUnitarioReal: 4000,
    costoTotal: 8000,
    gananciaBruta: 5000,
    modoDescuentoLote: 'MANUAL',
    detalle: null,
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-10'),
    venta: null as unknown as VentaEntity,
    producto: null as unknown as Producto,
    lote: null as unknown as LoteProducto,
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

  const crearPagoVenta = (overrides: Partial<PagoVenta> = {}): PagoVenta => ({
    idPagoVenta: 1,
    idVenta: 100,
    metodoPago: 'EFECTIVO',
    monto: 13000,
    referencia: null,
    observaciones: null,
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-10'),
    venta: null as unknown as VentaEntity,
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
      if (
        entity &&
        typeof entity === 'object' &&
        'metodoPago' in entity &&
        'monto' in entity
      ) {
        return Promise.resolve({ idPagoVenta: 1, ...entity } as PagoVenta);
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

    pagosRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((plain: unknown) => plain as PagoVenta),
    } as unknown as jest.Mocked<Repository<PagoVenta>>;

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
          provide: getRepositoryToken(PagoVenta),
          useValue: pagosRepository,
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
        create: jest.fn((plain: unknown) => plain),
        save: managerSaveMock,
      } as unknown as Repository<unknown>);

      const dto: CreateVentaDto = {
        numeroVenta: 1001,
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
    });

    it('debe cambiar estadoLote a AGOTADO si cantidadDisponible llega a 0', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 2,
        estadoLote: 'VENDIDO_PARCIAL',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
        create: jest.fn((plain: unknown) => plain),
        save: managerSaveMock,
      } as unknown as Repository<unknown>);

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
        cantidadDisponible: 1,
        estadoLote: 'VENDIDO_PARCIAL',
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
            cantidad: 2,
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
        idLote: 1,
        idProducto: 9,
        cantidadDisponible: 3,
        costoUnitarioReal: 1000,
        estadoLote: 'EN_STOCK',
      });
      const lote2 = crearLote({
        idLote: 2,
        idProducto: 9,
        cantidadDisponible: 5,
        costoUnitarioReal: 1200,
        estadoLote: 'EN_STOCK',
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getMany.mockResolvedValue([lote1, lote2]);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
        create: jest.fn((plain: unknown) => plain),
        save: managerSaveMock,
      } as unknown as Repository<unknown>);

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

  describe('create - Manejo de errores, pagos iniciales y transaccionalidad', () => {
    it('debe propagar error si inventarioService.registrarMovimiento falla', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
        create: jest.fn((plain: unknown) => plain),
        save: managerSaveMock,
      } as unknown as Repository<unknown>);

      inventarioService.registrarMovimiento.mockRejectedValue(
        new Error('Fallo inventario'),
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

      await expect(service.create(dto)).rejects.toThrow('Fallo inventario');
    });

    it('debe rechazar venta si montoPagado es mayor a totalVenta', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
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

    it('debe registrar PagoVenta inicial cuando montoPagado > 0', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
        create: jest.fn((plain: unknown) => plain),
        save: managerSaveMock,
      } as unknown as Repository<unknown>);

      const dto: CreateVentaDto = {
        numeroVenta: 1008,
        fechaVenta: '2026-09-10',
        medioPago: 'SINPE',
        montoPagado: 6500,
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

      await service.create(dto);

      expect(managerSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idVenta: 100,
          metodoPago: 'SINPE',
          monto: 6500,
        }),
      );
    });

    it('no debe registrar PagoVenta inicial cuando montoPagado = 0 (crédito)', async () => {
      const loteMock = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadDisponible: 5,
      });

      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(loteMock);

      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
        create: jest.fn((plain: unknown) => plain),
        save: managerSaveMock,
      } as unknown as Repository<unknown>);

      const dto: CreateVentaDto = {
        numeroVenta: 1009,
        fechaVenta: '2026-09-10',
        medioPago: 'SINPE',
        montoPagado: 0,
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

      await service.create(dto);

      expect(managerSaveMock).not.toHaveBeenCalledWith(
        PagoVenta,
        expect.anything(),
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

  describe('anularVenta', () => {
    const mockRepositories = (repos: {
      venta?: Partial<Repository<VentaEntity>>;
      detalle?: Partial<Repository<DetalleVenta>>;
      lote?: Partial<Repository<LoteProducto>>;
      pago?: Partial<Repository<PagoVenta>>;
    }) => {
      manager.getRepository.mockImplementation((entityClass: unknown) => {
        if (entityClass === VentaEntity) {
          return (repos.venta ?? {}) as unknown as Repository<VentaEntity>;
        }
        if (entityClass === DetalleVenta) {
          return (repos.detalle ?? {}) as unknown as Repository<DetalleVenta>;
        }
        if (entityClass === LoteProducto) {
          return (repos.lote ?? {}) as unknown as Repository<LoteProducto>;
        }
        if (entityClass === PagoVenta) {
          return (repos.pago ?? {}) as unknown as Repository<PagoVenta>;
        }
        return {} as unknown as Repository<unknown>;
      });
    };

    it('debe lanzar NotFoundException si la venta no existe', async () => {
      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(null);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
        },
      });

      await expect(service.anularVenta(999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si la venta ya está anulada y no registrar movimientos', async () => {
      const ventaAnulada = crearVenta({
        idVenta: 100,
        estadoVenta: 'ANULADA',
      });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaAnulada);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
        },
      });

      await expect(service.anularVenta(100)).rejects.toThrow(ConflictException);
      expect(inventarioService.registrarMovimiento).not.toHaveBeenCalled();
    });

    it('debe solicitar bloqueo pessimistic_write sobre Venta y Lotes, y preservar montoPagado histórico', async () => {
      const ventaActiva = crearVenta({
        idVenta: 100,
        estadoVenta: 'REGISTRADA',
        montoPagado: 5000,
        saldoPendiente: 8000,
      });

      const detalle1 = crearDetalleVenta({
        idDetalleVenta: 1,
        idVenta: 100,
        idProducto: 6,
        idLote: 13,
        cantidad: 2,
      });

      const lote13 = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadRecibida: 10,
        cantidadDisponible: 8,
        estadoLote: 'VENDIDO_PARCIAL',
      });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([lote13]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
          save: managerSaveMock,
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle1]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      await service.anularVenta(100);

      expect(ventaQbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(loteQbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(loteQbMock.orderBy).toHaveBeenCalledWith('lote.idLote', 'ASC');

      expect(lote13.cantidadDisponible).toBe(10);
      expect(lote13.estadoLote).toBe('EN_STOCK');
      expect(managerSaveMock).toHaveBeenCalledWith(LoteProducto, lote13);

      expect(inventarioService.registrarMovimiento).toHaveBeenCalledWith(
        manager,
        expect.objectContaining({
          lote: lote13,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 2,
          referenciaId: 100,
        }),
      );

      expect(ventaActiva.estadoVenta).toBe('ANULADA');
      expect(ventaActiva.estadoPago).toBe('ANULADA');
      expect(ventaActiva.montoPagado).toBe(5000);
      expect(ventaActiva.saldoPendiente).toBe(0);
    });

    it('debe mantener estadoLote VENDIDO_PARCIAL si el reingreso no completa la cantidadRecibida', async () => {
      const ventaActiva = crearVenta({ idVenta: 100 });
      const detalle = crearDetalleVenta({ idLote: 13, cantidad: 2 });
      const lote = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadRecibida: 10,
        cantidadDisponible: 5,
      });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([lote]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
          save: managerSaveMock,
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      await service.anularVenta(100);

      expect(lote.cantidadDisponible).toBe(7);
      expect(lote.estadoLote).toBe('VENDIDO_PARCIAL');
    });

    it('debe lanzar ConflictException si el reingreso superaría la cantidadRecibida', async () => {
      const ventaActiva = crearVenta({ idVenta: 100 });
      const detalle = crearDetalleVenta({ idLote: 13, cantidad: 2 });
      const lote = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadRecibida: 5,
        cantidadDisponible: 4,
      });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([lote]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      await expect(service.anularVenta(100)).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si un lote referenciado no existe', async () => {
      const ventaActiva = crearVenta({ idVenta: 100 });
      const detalle = crearDetalleVenta({ idLote: 99 });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      await expect(service.anularVenta(100)).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si el producto del lote no coincide con el detalle', async () => {
      const ventaActiva = crearVenta({ idVenta: 100 });
      const detalle = crearDetalleVenta({ idProducto: 6, idLote: 13 });
      const lote = crearLote({ idProducto: 9, idLote: 13 });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([lote]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      await expect(service.anularVenta(100)).rejects.toThrow(ConflictException);
    });

    it('debe registrar múltiples movimientos de reingreso al anular una venta FIFO con varios lotes', async () => {
      const ventaActiva = crearVenta({ idVenta: 100 });
      const detalle1 = crearDetalleVenta({
        idDetalleVenta: 1,
        idLote: 16,
        idProducto: 9,
        cantidad: 10,
      });
      const detalle2 = crearDetalleVenta({
        idDetalleVenta: 2,
        idLote: 17,
        idProducto: 9,
        cantidad: 2,
      });

      const lote1 = crearLote({
        idLote: 16,
        idProducto: 9,
        cantidadRecibida: 10,
        cantidadDisponible: 0,
      });
      const lote2 = crearLote({
        idLote: 17,
        idProducto: 9,
        cantidadRecibida: 5,
        cantidadDisponible: 3,
      });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([lote1, lote2]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
          save: managerSaveMock,
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle1, detalle2]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      await service.anularVenta(100);

      expect(inventarioService.registrarMovimiento).toHaveBeenCalledTimes(2);

      expect(inventarioService.registrarMovimiento).toHaveBeenNthCalledWith(
        1,
        manager,
        expect.objectContaining({
          lote: lote1,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 10,
          referenciaId: 100,
        }),
      );

      expect(inventarioService.registrarMovimiento).toHaveBeenNthCalledWith(
        2,
        manager,
        expect.objectContaining({
          lote: lote2,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 2,
          referenciaId: 100,
        }),
      );
    });

    it('debe propagar error y no anular la venta si registrarMovimiento falla', async () => {
      const ventaActiva = crearVenta({ idVenta: 100 });
      const detalle = crearDetalleVenta({ idLote: 13, cantidad: 2 });
      const lote = crearLote({
        idLote: 13,
        idProducto: 6,
        cantidadRecibida: 10,
        cantidadDisponible: 8,
      });

      const ventaQbMock = crearQueryBuilderMock();
      ventaQbMock.getOne.mockResolvedValue(ventaActiva);

      const loteQbMock = crearQueryBuilderMock();
      loteQbMock.getMany.mockResolvedValue([lote]);

      mockRepositories({
        venta: {
          createQueryBuilder: jest.fn().mockReturnValue(ventaQbMock),
        },
        detalle: {
          find: jest.fn().mockResolvedValue([detalle]),
        },
        lote: {
          createQueryBuilder: jest.fn().mockReturnValue(loteQbMock),
        },
      });

      inventarioService.registrarMovimiento.mockRejectedValue(
        new Error('Fallo movimiento'),
      );

      await expect(service.anularVenta(100)).rejects.toThrow(
        'Fallo movimiento',
      );
    });
  });

  describe('registrarPago', () => {
    const mockVentaRepository = (venta: VentaEntity | null) => {
      const qbMock = crearQueryBuilderMock();
      qbMock.getOne.mockResolvedValue(venta);

      manager.getRepository.mockImplementation((entityClass: unknown) => {
        if (entityClass === VentaEntity) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(qbMock),
            save: managerSaveMock,
          } as unknown as Repository<VentaEntity>;
        }
        if (entityClass === PagoVenta) {
          return {
            create: jest.fn((plain: unknown) => plain as PagoVenta),
            save: managerSaveMock,
          } as unknown as Repository<PagoVenta>;
        }
        return {} as unknown as Repository<unknown>;
      });

      return qbMock;
    };

    it('debe lanzar NotFoundException si la venta no existe', async () => {
      mockVentaRepository(null);

      const dto: RegistrarPagoVentaDto = {
        monto: 1000,
        metodoPago: 'SINPE',
      };

      await expect(service.registrarPago(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si la venta está anulada', async () => {
      const ventaAnulada = crearVenta({
        idVenta: 100,
        estadoVenta: 'ANULADA',
      });
      mockVentaRepository(ventaAnulada);

      const dto: RegistrarPagoVentaDto = {
        monto: 1000,
        metodoPago: 'SINPE',
      };

      await expect(service.registrarPago(100, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException si la venta ya está pagada completamente', async () => {
      const ventaPagada = crearVenta({
        idVenta: 100,
        totalVenta: 10000,
        montoPagado: 10000,
        saldoPendiente: 0,
        estadoPago: 'PAGADA',
      });
      mockVentaRepository(ventaPagada);

      const dto: RegistrarPagoVentaDto = {
        monto: 1000,
        metodoPago: 'SINPE',
      };

      await expect(service.registrarPago(100, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe solicitar bloqueo pessimistic_write sobre la Venta al registrar pago', async () => {
      const venta = crearVenta({
        idVenta: 100,
        totalVenta: 10000,
        montoPagado: 2000,
        saldoPendiente: 8000,
        estadoPago: 'PARCIAL',
        medioPago: 'SINPE',
      });
      const qbMock = mockVentaRepository(venta);

      const dto: RegistrarPagoVentaDto = {
        monto: 3000,
        metodoPago: 'SINPE',
        referencia: 'SINPE-1234',
        observaciones: 'Segundo abono',
      };

      await service.registrarPago(100, dto);

      expect(qbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(venta.montoPagado).toBe(5000);
      expect(venta.saldoPendiente).toBe(5000);
      expect(venta.estadoPago).toBe('PARCIAL');
      expect(venta.medioPago).toBe('SINPE');
      expect(managerSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          montoPagado: 5000,
          saldoPendiente: 5000,
          estadoPago: 'PARCIAL',
          medioPago: 'SINPE',
        }),
      );
    });

    it('debe cambiar medioPago a MIXTO si se abona con un método diferente al inicial', async () => {
      const venta = crearVenta({
        idVenta: 100,
        totalVenta: 10000,
        montoPagado: 2000,
        saldoPendiente: 8000,
        estadoPago: 'PARCIAL',
        medioPago: 'SINPE',
      });
      mockVentaRepository(venta);

      const dto: RegistrarPagoVentaDto = {
        monto: 3000,
        metodoPago: 'EFECTIVO',
      };

      await service.registrarPago(100, dto);

      expect(venta.medioPago).toBe('MIXTO');
      expect(venta.montoPagado).toBe(5000);
    });

    it('debe marcar estadoPago como PAGADA y saldoPendiente 0 si el pago liquida el saldo total', async () => {
      const venta = crearVenta({
        idVenta: 100,
        totalVenta: 10000,
        montoPagado: 7000,
        saldoPendiente: 3000,
        estadoPago: 'PARCIAL',
        medioPago: 'EFECTIVO',
      });
      mockVentaRepository(venta);

      const dto: RegistrarPagoVentaDto = {
        monto: 3000,
        metodoPago: 'EFECTIVO',
      };

      await service.registrarPago(100, dto);

      expect(venta.montoPagado).toBe(10000);
      expect(venta.saldoPendiente).toBe(0);
      expect(venta.estadoPago).toBe('PAGADA');
    });

    it('debe lanzar BadRequestException si el monto del pago supera el saldo pendiente', async () => {
      const venta = crearVenta({
        idVenta: 100,
        totalVenta: 10000,
        montoPagado: 8000,
        saldoPendiente: 2000,
        estadoPago: 'PARCIAL',
      });
      mockVentaRepository(venta);

      const dto: RegistrarPagoVentaDto = {
        monto: 2500,
        metodoPago: 'EFECTIVO',
      };

      await expect(service.registrarPago(100, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listarPagosVenta', () => {
    it('debe lanzar NotFoundException si la venta no existe', async () => {
      ventasRepository.findOne.mockResolvedValue(null);

      await expect(service.listarPagosVenta(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar lista de pagos formateados para la venta', async () => {
      const pago1 = crearPagoVenta({
        idPagoVenta: 1,
        idVenta: 100,
        metodoPago: 'SINPE',
        monto: 2000,
        referencia: 'REF-1',
      });
      const pago2 = crearPagoVenta({
        idPagoVenta: 2,
        idVenta: 100,
        metodoPago: 'EFECTIVO',
        monto: 3000,
      });

      ventasRepository.findOne.mockResolvedValue(crearVenta({ idVenta: 100 }));
      pagosRepository.find.mockResolvedValue([pago1, pago2]);

      const resultado = await service.listarPagosVenta(100);

      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toEqual(
        expect.objectContaining({
          idPagoVenta: 1,
          idVenta: 100,
          metodoPago: 'SINPE',
          monto: 2000,
          referencia: 'REF-1',
        }),
      );
      expect(resultado[1]).toEqual(
        expect.objectContaining({
          idPagoVenta: 2,
          idVenta: 100,
          metodoPago: 'EFECTIVO',
          monto: 3000,
          referencia: null,
        }),
      );
    });
  });
});
