import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;

  const lotesRepositoryMock = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };

  const movimientosQueryBuilderMock = {
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  const movimientosRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const productosRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const pedidosRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const managerMovimientoRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const managerMock = {
    getRepository: jest.fn(),
  };

  const crearLote = (overrides: Partial<LoteProducto> = {}): LoteProducto =>
    ({
      idLote: 10,
      idProducto: 6,
      idPedido: 1,
      idDetallePedido: 1,
      codigoLote: 'L1',
      cantidadInicial: 10,
      cantidadRecibida: 0,
      cantidadDisponible: 0,
      costoUnitarioReal: 4000,
      precioVentaRecomendado: 6500,
      estadoLote: 'EN_PROCESO',
      fechaEntrada: null,
      ...overrides,
    }) as LoteProducto;

  beforeEach(async () => {
    jest.clearAllMocks();

    movimientosQueryBuilderMock.andWhere.mockReturnValue(
      movimientosQueryBuilderMock,
    );
    movimientosQueryBuilderMock.orderBy.mockReturnValue(
      movimientosQueryBuilderMock,
    );
    movimientosQueryBuilderMock.addOrderBy.mockReturnValue(
      movimientosQueryBuilderMock,
    );
    movimientosQueryBuilderMock.skip.mockReturnValue(
      movimientosQueryBuilderMock,
    );
    movimientosQueryBuilderMock.take.mockReturnValue(
      movimientosQueryBuilderMock,
    );
    movimientosQueryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);

    movimientosRepositoryMock.createQueryBuilder.mockReturnValue(
      movimientosQueryBuilderMock,
    );

    managerMock.getRepository.mockReturnValue(managerMovimientoRepoMock);
    managerMovimientoRepoMock.create.mockImplementation(
      (dto: Partial<MovimientoInventario>) => dto,
    );
    managerMovimientoRepoMock.save.mockImplementation(
      (ent: Partial<MovimientoInventario>) =>
        Promise.resolve({ idMovimiento: 1, ...ent }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        {
          provide: getRepositoryToken(LoteProducto),
          useValue: lotesRepositoryMock,
        },
        {
          provide: getRepositoryToken(MovimientoInventario),
          useValue: movimientosRepositoryMock,
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: productosRepositoryMock,
        },
        {
          provide: getRepositoryToken(PedidoCompraEntity),
          useValue: pedidosRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<InventarioService>(InventarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listarLotes', () => {
    it('debe listar lotes paginados con producto y pedido asociados', async () => {
      const lote = crearLote({
        idLote: 20,
        idProducto: 6,
        idPedido: 15,
        cantidadInicial: 10,
        cantidadRecibida: 10,
        cantidadDisponible: 10,
        estadoLote: 'EN_STOCK',
      });
      const producto = {
        idProducto: 6,
        nombre: 'Aceite',
        activo: true,
      } as Producto;
      const pedido = {
        idPedido: 15,
        numeroPedido: 30,
        estado: 'RECIBIDO',
      } as PedidoCompraEntity;

      lotesRepositoryMock.findAndCount.mockResolvedValue([[lote], 1]);
      productosRepositoryMock.find.mockResolvedValue([producto]);
      pedidosRepositoryMock.find.mockResolvedValue([pedido]);

      const resultado = await service.listarLotes({ pagina: 1, limite: 10 });

      expect(resultado.total).toBe(1);
      expect(resultado.pagina).toBe(1);
      expect(resultado.limite).toBe(10);
      expect(resultado.totalPaginas).toBe(1);
      expect(resultado.items[0].idLote).toBe(20);
      expect(resultado.items[0].producto?.nombre).toBe('Aceite');
      expect(resultado.items[0].pedido?.numeroPedido).toBe(30);
    });

    it('45. Test de matemáticas del lote (inicial 10, recibida 7, disponible 5)', async () => {
      const lote = crearLote({
        idLote: 10,
        cantidadInicial: 10,
        cantidadRecibida: 7,
        cantidadDisponible: 5,
      });

      lotesRepositoryMock.findAndCount.mockResolvedValue([[lote], 1]);
      productosRepositoryMock.find.mockResolvedValue([]);
      pedidosRepositoryMock.find.mockResolvedValue([]);

      const resultado = await service.listarLotes({});
      const item = resultado.items[0];

      expect(item.cantidadInicial).toBe(10);
      expect(item.cantidadRecibida).toBe(7);
      expect(item.cantidadDisponible).toBe(5);
      expect(item.cantidadVendida).toBe(2);
      expect(item.cantidadPendienteRecepcion).toBe(3);
    });

    it('debe aplicar filtros por productoId, pedidoId y estadoLote', async () => {
      lotesRepositoryMock.findAndCount.mockResolvedValue([[], 0]);

      await service.listarLotes({
        productoId: 6,
        pedidoId: 10,
        estadoLote: 'EN_STOCK',
      });

      expect(lotesRepositoryMock.findAndCount).toHaveBeenCalledWith({
        where: {
          idProducto: 6,
          idPedido: 10,
          estadoLote: 'EN_STOCK',
        },
        order: { idLote: 'DESC' },
        skip: 0,
        take: 50,
      });
    });
  });

  describe('buscarLotePorId', () => {
    it('debe retornar lote mapeado si existe', async () => {
      const lote = crearLote({ idLote: 10, idProducto: 6, idPedido: 1 });
      const producto = {
        idProducto: 6,
        nombre: 'Aceite',
        activo: true,
      } as Producto;
      const pedido = {
        idPedido: 1,
        numeroPedido: 100,
        estado: 'RECIBIDO',
      } as PedidoCompraEntity;

      lotesRepositoryMock.findOne.mockResolvedValue(lote);
      productosRepositoryMock.findOne.mockResolvedValue(producto);
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      const resultado = await service.buscarLotePorId(10);

      expect(resultado.idLote).toBe(10);
      expect(resultado.producto?.nombre).toBe('Aceite');
      expect(resultado.pedido?.numeroPedido).toBe(100);
    });

    it('debe lanzar 404 si el lote no existe', async () => {
      lotesRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.buscarLotePorId(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar 400 si el ID es inválido', async () => {
      await expect(service.buscarLotePorId(0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buscarLotePorId(-1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buscarLotePorId(Number.NaN)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listarLotesProducto', () => {
    it('debe retornar lotes del producto si el producto existe', async () => {
      const producto = { idProducto: 6, nombre: 'Aceite' } as Producto;
      productosRepositoryMock.findOne.mockResolvedValue(producto);

      const lote = crearLote({ idLote: 10, idProducto: 6 });
      lotesRepositoryMock.findAndCount.mockResolvedValue([[lote], 1]);
      productosRepositoryMock.find.mockResolvedValue([producto]);
      pedidosRepositoryMock.find.mockResolvedValue([]);

      const resultado = await service.listarLotesProducto(6, {});

      expect(resultado.items).toHaveLength(1);
      expect(resultado.items[0].idProducto).toBe(6);
    });

    it('producto existente sin lotes retorna items vacíos []', async () => {
      const producto = { idProducto: 6, nombre: 'Aceite' } as Producto;
      productosRepositoryMock.findOne.mockResolvedValue(producto);
      lotesRepositoryMock.findAndCount.mockResolvedValue([[], 0]);

      const resultado = await service.listarLotesProducto(6, {});

      expect(resultado.items).toEqual([]);
      expect(resultado.total).toBe(0);
    });

    it('producto inexistente lanza 404', async () => {
      productosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.listarLotesProducto(999, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('productoId inválido lanza 400', async () => {
      await expect(service.listarLotesProducto(0, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listarMovimientos', () => {
    it('debe listar movimientos con orden DESC y relaciones mapeadas', async () => {
      const mov = {
        idMovimiento: 1,
        idProducto: 6,
        idLote: 10,
        fechaMovimiento: new Date(),
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 5,
        referenciaTipo: 'PEDIDO',
        referenciaId: 13,
        usuario: null,
        motivo: 'Recepción',
        observaciones: null,
        costoUnitario: 4000,
        totalMovimiento: 20000,
      } as MovimientoInventario;

      movimientosQueryBuilderMock.getManyAndCount.mockResolvedValue([[mov], 1]);
      productosRepositoryMock.find.mockResolvedValue([
        { idProducto: 6, nombre: 'Aceite' } as Producto,
      ]);
      lotesRepositoryMock.find.mockResolvedValue([
        crearLote({ idLote: 10, codigoLote: 'L1' }),
      ]);

      const resultado = await service.listarMovimientos({});

      expect(resultado.total).toBe(1);
      expect(resultado.items[0].tipoMovimiento).toBe('ENTRADA_COMPRA');
      expect(resultado.items[0].producto?.nombre).toBe('Aceite');
      expect(resultado.items[0].lote?.codigoLote).toBe('L1');
      expect(movimientosQueryBuilderMock.orderBy).toHaveBeenCalledWith(
        'movimiento.fechaMovimiento',
        'DESC',
      );
    });

    it('debe aplicar filtros por productoId, loteId, tipoMovimiento, referenciaTipo, referenciaId, usuarioId y fechas', async () => {
      movimientosQueryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listarMovimientos({
        productoId: 6,
        loteId: 10,
        tipoMovimiento: 'ENTRADA_COMPRA',
        referenciaTipo: 'PEDIDO',
        referenciaId: 13,
        usuarioId: 2,
        desde: '2026-09-01',
        hasta: '2026-09-08',
      });

      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'movimiento.idProducto = :productoId',
        { productoId: 6 },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'movimiento.idLote = :loteId',
        { loteId: 10 },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'movimiento.tipoMovimiento = :tipoMovimiento',
        { tipoMovimiento: 'ENTRADA_COMPRA' },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'movimiento.referenciaTipo = :referenciaTipo',
        { referenciaTipo: 'PEDIDO' },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'movimiento.referenciaId = :referenciaId',
        { referenciaId: 13 },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'movimiento.idUsuario = :usuarioId',
        { usuarioId: 2 },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'CAST(movimiento.fechaMovimiento AS date) >= :desde',
        { desde: '2026-09-01' },
      );
      expect(movimientosQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'CAST(movimiento.fechaMovimiento AS date) <= :hasta',
        { hasta: '2026-09-08' },
      );
    });

    it('debe lanzar 400 si fecha desde es posterior a fecha hasta', async () => {
      await expect(
        service.listarMovimientos({
          desde: '2026-09-10',
          hasta: '2026-09-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('buscarMovimientoPorId', () => {
    it('debe retornar movimiento si existe', async () => {
      const mov = {
        idMovimiento: 1,
        idProducto: 6,
        idLote: 10,
        fechaMovimiento: new Date(),
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 3,
        referenciaTipo: 'PEDIDO',
        referenciaId: 13,
        idUsuario: 2,
        usuario: 'operador1',
        costoUnitario: 4000,
        totalMovimiento: 12000,
      } as MovimientoInventario;

      movimientosRepositoryMock.findOne.mockResolvedValue(mov);
      productosRepositoryMock.findOne.mockResolvedValue({
        idProducto: 6,
        nombre: 'Aceite',
      });
      lotesRepositoryMock.findOne.mockResolvedValue(
        crearLote({ idLote: 10, codigoLote: 'L1' }),
      );

      const resultado = await service.buscarMovimientoPorId(1);

      expect(resultado.idMovimiento).toBe(1);
      expect(resultado.idUsuario).toBe(2);
      expect(resultado.usuario).toBe('operador1');
      expect(resultado.producto?.nombre).toBe('Aceite');
      expect(resultado.lote?.codigoLote).toBe('L1');
    });

    it('debe lanzar 404 si el movimiento no existe', async () => {
      movimientosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.buscarMovimientoPorId(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar 400 si el ID es inválido', async () => {
      await expect(service.buscarMovimientoPorId(0)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registrarMovimiento (infraestructura y auditoría)', () => {
    const actorValido = {
      idUsuario: 2,
      username: 'operador1',
    };

    it('ENTRADA_COMPRA genera referenciaTipo PEDIDO, guarda actor y calcula total', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      const resultado = await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 5,
          referenciaId: 30,
          actor: actorValido,
        },
      );

      expect(managerMovimientoRepoMock.create).toHaveBeenCalledWith({
        idProducto: 6,
        idLote: 10,
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 5,
        referenciaTipo: 'PEDIDO',
        referenciaId: 30,
        idUsuario: 2,
        usuario: 'operador1',
        motivo: 'Recepción de mercancía por compra',
        observaciones: null,
        costoUnitario: 4000,
        totalMovimiento: 20000,
      });
      expect(resultado).toBeDefined();
    });

    it('SALIDA_VENTA genera referenciaTipo VENTA y asigna actor', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 2,
          referenciaId: 50,
          actor: actorValido,
        },
      );

      expect(managerMovimientoRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 2,
          referenciaTipo: 'VENTA',
          referenciaId: 50,
          idUsuario: 2,
          usuario: 'operador1',
          motivo: 'Salida de inventario por venta',
          totalMovimiento: 8000,
        }),
      );
    });

    it('REINGRESO_ANULACION_VENTA genera referenciaTipo VENTA y asigna actor', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 2,
          referenciaId: 50,
          actor: {
            idUsuario: 1,
            username: 'admin',
          },
        },
      );

      expect(managerMovimientoRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 2,
          referenciaTipo: 'VENTA',
          referenciaId: 50,
          idUsuario: 1,
          usuario: 'admin',
          motivo: 'Reingreso de inventario por anulación de venta',
          totalMovimiento: 8000,
        }),
      );
    });

    it('aplica trim al snapshot de username del actor', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 1,
          referenciaId: 10,
          actor: {
            idUsuario: 2,
            username: '   operador1   ',
          },
        },
      );

      expect(managerMovimientoRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idUsuario: 2,
          usuario: 'operador1',
        }),
      );
    });

    it('debe rechazar con 409 ConflictException si idUsuario es 0, negativo o inválido', async () => {
      const lote = crearLote();

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          actor: { idUsuario: 0, username: 'admin' },
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          actor: { idUsuario: -1, username: 'admin' },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar con 409 ConflictException si username está vacío o son solo espacios', async () => {
      const lote = crearLote();

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          actor: { idUsuario: 1, username: '   ' },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('Cantidad 0 lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 0,
          referenciaId: 1,
          actor: actorValido,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Costo inválido lanza 409 ConflictException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ costoUnitarioReal: -1 }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          actor: actorValido,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
