import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { InventarioService } from '../inventario/inventario.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { RecepcionPedidoDto } from './dto/recepcion-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PedidosService } from './pedidos.service';

interface MockQueryBuilder {
  setLock: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  take: jest.Mock;
  getOne: jest.Mock;
  getMany: jest.Mock;
}

describe('PedidosService', () => {
  let service: PedidosService;

  const crearQueryBuilderMock = (): MockQueryBuilder => {
    const qb: MockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };
    return qb;
  };

  const crearPedido = (
    overrides: Partial<PedidoCompraEntity> = {},
  ): PedidoCompraEntity => ({
    idPedido: 1,
    numeroPedido: 100,
    nombrePedido: 'Pedido 100',
    idOrigenCompra: 1,
    fechaPedido: '2026-09-01',
    fechaRecepcion: null,
    paisCompra: 'Costa Rica',
    monedaCompra: 'CRC',
    tipoCambio: 1,
    estado: 'REGISTRADO',
    inversionTotal: 10000,
    subtotalProductos: 10000,
    costoEnvio: 0,
    impuestosImportacion: 0,
    envioInterno: 0,
    envioCasillero: 0,
    otrosGastos: 0,
    metodoRepartoGastos: 'SIN_GASTOS',
    observaciones: null,
    origenCompra: {
      idOrigenCompra: 1,
      nombreReferencia: 'Proveedor 1',
      estado: 'ACTIVO',
    } as OrigenCompra,
    lotes: [],
    detalles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const crearProducto = (overrides: Partial<Producto> = {}): Producto =>
    ({
      idProducto: 1,
      nombre: 'Filtro de aceite',
      idCategoria: 1,
      stockMinimo: 5,
      activo: true,
      sku: 'FIL-001',
      costoPromedioPonderado: 2500,
      precioVentaSugerido: 4000,
      categoria: { idCategoria: 1, nombre: 'Repuestos', activo: true } as Categoria,
      lotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Producto);

  const crearLote = (overrides: Partial<LoteProducto> = {}): LoteProducto =>
    ({
      idLote: 10,
      idPedido: 1,
      idProducto: 1,
      idDetallePedido: 1,
      codigoLote: 'L1',
      cantidadInicial: 10,
      cantidadRecibida: 0,
      cantidadDisponible: 0,
      estadoLote: 'EN_PROCESO',
      fechaEntrada: null,
      costoUnitarioReal: 1000,
      precioVentaRecomendado: 2000,
      precioVentaFinal: null,
      tipoLote: 'COMPRA',
      costoPendienteAlVender: 0,
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as LoteProducto;

  let pedidosRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let managerMock: {
    getRepository: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  let dataSourceMock: {
    getRepository: jest.Mock;
    transaction: jest.Mock;
  };

  let origenCompraRepoMock: { findOne: jest.Mock };
  let productoRepoMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let loteRepoMock: {
    find: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let detalleVentaRepoMock: { count: jest.Mock };
  let categoriaRepoMock: {
    findOne: jest.Mock;
  };
  let detallePedidoRepoMock: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  let inventarioServiceMock: {
    registrarMovimiento: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    inventarioServiceMock = {
      registrarMovimiento: jest.fn().mockResolvedValue({}),
    };

    pedidosRepositoryMock = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    origenCompraRepoMock = {
      findOne: jest.fn(),
    };

    productoRepoMock = {
      findOne: jest.fn().mockResolvedValue(crearProducto({ idProducto: 1 })),
      create: jest.fn((p) => ({ idProducto: 1, ...p })),
      save: jest.fn((p) => Promise.resolve({ idProducto: 1, ...p })),
      createQueryBuilder: jest.fn(),
    };

    loteRepoMock = {
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    detalleVentaRepoMock = {
      count: jest.fn(),
    };

    categoriaRepoMock = {
      findOne: jest.fn().mockResolvedValue({ idCategoria: 1, activo: true }),
    };

    detallePedidoRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    managerMock = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === PedidoCompraEntity) return pedidosRepositoryMock;
        if (entity === OrigenCompra) return origenCompraRepoMock;
        if (entity === Producto) return productoRepoMock;
        if (entity === LoteProducto) return loteRepoMock;
        if (entity === DetalleVenta) return detalleVentaRepoMock;
        if (entity === DetallePedidoCompra) return detallePedidoRepoMock;
        if (entity === Categoria) return categoriaRepoMock;
        return null;
      }),
      create: jest.fn((_entity: unknown, val: object) => val),
      save: jest.fn((_entity: unknown, val: object) =>
        Promise.resolve({
          idPedido: 1,
          idDetallePedido: 1,
          idLote: 10,
          ...val,
        }),
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    dataSourceMock = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === PedidoCompraEntity) return pedidosRepositoryMock;
        if (entity === OrigenCompra) return origenCompraRepoMock;
        if (entity === Producto) return productoRepoMock;
        if (entity === LoteProducto) return loteRepoMock;
        if (entity === DetalleVenta) return detalleVentaRepoMock;
        return null;
      }),
      transaction: jest
        .fn()
        .mockImplementation((...args: any[]) => {
          const callback = typeof args[0] === 'function' ? args[0] : args[1];
          return callback(managerMock as unknown as EntityManager);
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: getRepositoryToken(PedidoCompraEntity),
          useValue: pedidosRepositoryMock,
        },
        {
          provide: InventarioService,
          useValue: inventarioServiceMock,
        },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll / findOne', () => {
    it('findAll debe retornar arreglo de pedidos mapeados', async () => {
      const pedido = crearPedido();
      pedidosRepositoryMock.find.mockResolvedValue([pedido]);

      const resultado = await service.findAll();
      expect(pedidosRepositoryMock.find).toHaveBeenCalledWith({
        relations: {
          origenCompra: true,
          lotes: {
            producto: {
              categoria: true,
            },
            detallePedido: true,
          },
        },
        order: {
          idPedido: 'DESC',
        },
      });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].numeroPedido).toBe('100');
    });

    it('findOne debe retornar un pedido si existe', async () => {
      const pedido = crearPedido({ idPedido: 5 });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      const resultado = await service.findOne(5);
      expect(pedidosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { idPedido: 5 },
        relations: {
          origenCompra: true,
          lotes: {
            producto: {
              categoria: true,
            },
            detallePedido: true,
          },
        },
      });
      expect(resultado.id).toBe(5);
    });

    it('findOne debe lanzar NotFoundException si no existe', async () => {
      pedidosRepositoryMock.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findOne debe lanzar BadRequestException si el ID es inválido', async () => {
      await expect(service.findOne(-1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.findOne(0)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('buscarProductosSugeridos', () => {
    it('debe retornar [] si el texto de búsqueda tiene menos de 2 caracteres', async () => {
      const resultado = await service.buscarProductosSugeridos('f');
      expect(resultado).toEqual([]);
      expect(productoRepoMock.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('debe buscar productos activos por términos y mapearlos', async () => {
      const qb: MockQueryBuilder = crearQueryBuilderMock();
      qb.getMany.mockResolvedValue([
        {
          idProducto: 1,
          nombre: 'Filtro de aceite',
          precioVentaSugeridoSinIva: 4000,
          activo: true,
        },
      ]);
      productoRepoMock.createQueryBuilder.mockReturnValue(qb);

      const resultado = await service.buscarProductosSugeridos('filtro aceite');
      expect(qb.where).toHaveBeenCalledWith('producto.activo = :activo', {
        activo: true,
      });
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(resultado).toEqual([
        {
          id: 1,
          nombre: 'Filtro de aceite',
          nombreBusqueda: 'filtro de aceite',
          precioVentaSugerido: 4000,
          activo: true,
          categoriaId: null,
          categoriaNombre: null,
          marca: null,
        },
      ]);
    });
  });

  describe('create', () => {
    const createDto: CreatePedidoDto = {
      numeroPedido: 101,
      fecha: '2026-09-01',
      origen: 'Costa Rica',
      proveedorId: 1,
      monedaCompra: 'CRC',
      tipoCambio: 1,
      estado: 'REGISTRADO',
      observaciones: 'Prueba creacion',
      detalles: [
        {
          productoNombre: 'Filtro de aceite',
          loteCodigo: 'L1',
          cantidad: 10,
          costoUnitarioOrigen: 2000,
          precioVentaRecomendado: 3500,
          estadoLote: 'EN_PROCESO',
        },
      ],
    };

    it('debe crear un pedido con lote EN_PROCESO y stock 0', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue({
        idOrigenCompra: 1,
        estado: 'ACTIVO',
      });
      pedidosRepositoryMock.findOne.mockResolvedValue(crearPedido({ numeroPedido: 101 })); // findOneByNumeroPedido

      const prodQb: MockQueryBuilder = crearQueryBuilderMock();
      prodQb.getOne.mockResolvedValue({
        idProducto: 1,
        nombre: 'Filtro de aceite',
      });
      productoRepoMock.createQueryBuilder.mockReturnValue(prodQb);

      const resultado = await service.create(createDto);
      expect(resultado.numeroPedido).toBe('101');
      expect(managerMock.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el proveedor no existe', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si el proveedor está inactivo', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue({
        idOrigenCompra: 1,
        estado: 'INACTIVO',
      });
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('debe asignar el siguiente numeroPedido secuencial al crear', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue({
        idOrigenCompra: 1,
        estado: 'ACTIVO',
      });
      pedidosRepositoryMock.find.mockResolvedValue([{ numeroPedido: 100 }]);
      pedidosRepositoryMock.findOne.mockResolvedValue(
        crearPedido({ numeroPedido: 101 }),
      );

      const prodQb: MockQueryBuilder = crearQueryBuilderMock();
      prodQb.getOne.mockResolvedValue({
        idProducto: 1,
        nombre: 'Filtro de aceite',
      });
      productoRepoMock.createQueryBuilder.mockReturnValue(prodQb);

      const resultado = await service.create(createDto);
      expect(resultado.numeroPedido).toBe('101');
    });


    it('debe reutilizar producto por productoId si se proporciona', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue({
        idOrigenCompra: 1,
        estado: 'ACTIVO',
      });
      pedidosRepositoryMock.findOne.mockResolvedValue(crearPedido());

      productoRepoMock.findOne.mockResolvedValue({
        idProducto: 5,
        nombre: 'Producto 5',
      });

      await service.create({
        ...createDto,
        detalles: [{ ...createDto.detalles[0], productoId: 5 }],
      });

      expect(productoRepoMock.findOne).toHaveBeenCalledWith({
        where: { idProducto: 5 },
      });
      expect(productoRepoMock.create).not.toHaveBeenCalled();
    });

    it('debe crear un producto nuevo si no existe por nombre', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue({
        idOrigenCompra: 1,
        estado: 'ACTIVO',
      });
      pedidosRepositoryMock.findOne.mockResolvedValue(crearPedido());

      const prodQb: MockQueryBuilder = crearQueryBuilderMock();
      prodQb.getOne.mockResolvedValue(null);
      productoRepoMock.createQueryBuilder.mockReturnValue(prodQb);

      productoRepoMock.create.mockReturnValue({
        idProducto: 9,
        nombre: 'Filtro de aceite',
      });
      productoRepoMock.save.mockResolvedValue({
        idProducto: 9,
        nombre: 'Filtro de aceite',
      });

      await service.create(createDto);
      expect(productoRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Filtro de aceite' }),
      );
      expect(productoRepoMock.save).toHaveBeenCalled();
    });

    it('debe normalizar espacios del nombre del producto', async () => {
      origenCompraRepoMock.findOne.mockResolvedValue({
        idOrigenCompra: 1,
        estado: 'ACTIVO',
      });
      pedidosRepositoryMock.findOne.mockResolvedValue(crearPedido());

      const prodQb: MockQueryBuilder = crearQueryBuilderMock();
      prodQb.getOne.mockResolvedValue(null);
      productoRepoMock.createQueryBuilder.mockReturnValue(prodQb);

      productoRepoMock.create.mockReturnValue({
        idProducto: 10,
        nombre: 'Filtro de aceite',
      });
      productoRepoMock.save.mockResolvedValue({
        idProducto: 10,
        nombre: 'Filtro de aceite',
      });

      await service.create({
        ...createDto,
        detalles: [
          {
            ...createDto.detalles[0],
            productoNombre: '   Filtro   de   aceite   ',
          },
        ],
      });

      expect(productoRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Filtro de aceite' }),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdatePedidoDto = {
      detalles: [
        {
          productoNombre: 'Pastillas',
          loteCodigo: 'L1',
          cantidad: 15,
          costoUnitarioOrigen: 3000,
          precioVentaRecomendado: 5000,
          estadoLote: 'EN_PROCESO',
        },
      ],
    };

    it('debe permitir actualizar detalles de un pedido EN_PROCESO', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      const lote = crearLote({
        idPedido: 1,
        estadoLote: 'EN_PROCESO',
        cantidadRecibida: 0,
        cantidadDisponible: 0,
      });

      pedidosRepositoryMock.findOne
        .mockResolvedValueOnce(pedido)
        .mockResolvedValueOnce(pedido);
      loteRepoMock.find.mockResolvedValue([lote]);
      detalleVentaRepoMock.count.mockResolvedValue(0);

      const prodQb: MockQueryBuilder = crearQueryBuilderMock();
      prodQb.getOne.mockResolvedValue({ idProducto: 1, nombre: 'Pastillas' });
      productoRepoMock.createQueryBuilder.mockReturnValue(prodQb);

      const resultado = await service.update(1, updateDto);
      expect(resultado).toBeDefined();
      expect(managerMock.update).toHaveBeenCalled();
    });

    it('debe rechazar modificación estructural de pedido RECIBIDO con 409', async () => {
      const pedidoRecibido = crearPedido({ idPedido: 1, estado: 'RECIBIDO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedidoRecibido);
      loteRepoMock.find.mockResolvedValue([
        crearLote({ estadoLote: 'EN_STOCK' }),
      ]);

      await expect(service.update(1, updateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('debe rechazar modificación estructural si lote tiene cantidadRecibida > 0 con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      const loteConStock = crearLote({
        cantidadRecibida: 2,
        cantidadDisponible: 2,
        estadoLote: 'EN_STOCK',
      });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([loteConStock]);

      await expect(service.update(1, updateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('debe rechazar modificación estructural si lote tiene fechaEntrada con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      const loteConFecha = crearLote({ fechaEntrada: '2026-09-03' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([loteConFecha]);

      await expect(service.update(1, updateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('debe rechazar modificación estructural si lote fue utilizado en ventas con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([crearLote({ idLote: 10 })]);
      detalleVentaRepoMock.count.mockResolvedValue(1);

      await expect(service.update(1, updateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('debe permitir modificar solo observaciones de un pedido RECIBIDO', async () => {
      const pedidoRecibido = crearPedido({
        idPedido: 1,
        estado: 'RECIBIDO',
        observaciones: 'Anterior',
      });
      pedidosRepositoryMock.findOne
        .mockResolvedValueOnce(pedidoRecibido)
        .mockResolvedValueOnce(pedidoRecibido);

      const resultado = await service.update(1, {
        observaciones: 'Nueva observacion',
      });
      expect(resultado).toBeDefined();
      expect(managerMock.update).toHaveBeenCalledWith(
        PedidoCompraEntity,
        1,
        expect.objectContaining({ observaciones: 'Nueva observacion' }),
      );
    });

    it('debe rechazar cualquier modificación en un pedido CANCELADO con 409', async () => {
      const pedidoCancelado = crearPedido({ idPedido: 1, estado: 'CANCELADO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedidoCancelado);

      await expect(
        service.update(1, { observaciones: 'Cambio' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe rechazar cambio de tipoCambio sin detalles con 400', async () => {
      const pedido = crearPedido({ idPedido: 1, tipoCambio: 1 });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([crearLote()]);
      detalleVentaRepoMock.count.mockResolvedValue(0);

      await expect(
        service.update(1, { tipoCambio: 520 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove / cancelación', () => {
    it('debe cancelar un pedido REGISTRADO sin borrar filas', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([crearLote()]);
      detalleVentaRepoMock.count.mockResolvedValue(0);

      const respuesta = await service.remove(1);
      expect(respuesta).toEqual({
        message: 'Pedido cancelado correctamente.',
        id: 1,
      });
      expect(managerMock.update).toHaveBeenCalledWith(PedidoCompraEntity, 1, {
        estado: 'CANCELADO',
        fechaRecepcion: null,
      });
      expect(managerMock.delete).not.toHaveBeenCalled();
    });

    it('debe cancelar un pedido EN_TRANSITO sin recepcion', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'EN_TRANSITO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([crearLote()]);
      detalleVentaRepoMock.count.mockResolvedValue(0);

      const respuesta = await service.remove(1);
      expect(respuesta.message).toBe('Pedido cancelado correctamente.');
    });

    it('debe rechazar cancelar un pedido RECIBIDO con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'RECIBIDO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([
        crearLote({ estadoLote: 'EN_STOCK' }),
      ]);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe rechazar cancelar si tiene inventario materializado con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([
        crearLote({ cantidadRecibida: 5, estadoLote: 'EN_STOCK' }),
      ]);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe rechazar cancelar si tiene ventas asociadas con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'REGISTRADO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);
      loteRepoMock.find.mockResolvedValue([crearLote()]);
      detalleVentaRepoMock.count.mockResolvedValue(1);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe rechazar cancelar un pedido ya CANCELADO con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'CANCELADO' });
      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe lanzar NotFoundException si el pedido a cancelar no existe', async () => {
      pedidosRepositoryMock.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('recibir', () => {
    const actor = {
      idUsuario: 2,
      username: 'operador1',
    };

    const recepcionDto: RecepcionPedidoDto = {
      fechaRecepcion: '2026-09-03',
      detalles: [{ idLote: 10, cantidadRecibida: 3 }],
    };

    it('debe recibir parcialmente un pedido, actualizar lote a EN_STOCK y pedido a EN_TRANSITO', async () => {
      const pedido = crearPedido({
        idPedido: 1,
        fechaPedido: '2026-09-01',
        estado: 'REGISTRADO',
      });
      const lote = crearLote({
        idLote: 10,
        idPedido: 1,
        cantidadInicial: 10,
        cantidadRecibida: 0,
        cantidadDisponible: 0,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      const resultado = await service.recibir(1, recepcionDto, actor);
      expect(resultado).toBeDefined();
      expect(lote.cantidadRecibida).toBe(3);
      expect(lote.cantidadDisponible).toBe(3);
      expect(lote.estadoLote).toBe('EN_STOCK');
      expect(lote.fechaEntrada).toBe('2026-09-03');
      expect(pedido.estado).toBe('EN_TRANSITO');
      expect(pedido.fechaRecepcion).toBeNull();
    });

    it('debe acumular unidades en recepciones sucesivas y preservar la primera fechaEntrada', async () => {
      const pedido = crearPedido({
        idPedido: 1,
        fechaPedido: '2026-09-01',
        estado: 'EN_TRANSITO',
      });
      const lote = crearLote({
        idLote: 10,
        idPedido: 1,
        cantidadInicial: 10,
        cantidadRecibida: 3,
        cantidadDisponible: 3,
        fechaEntrada: '2026-09-03',
        estadoLote: 'EN_STOCK',
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await service.recibir(
        1,
        {
          fechaRecepcion: '2026-09-05',
          detalles: [{ idLote: 10, cantidadRecibida: 2 }],
        },
        actor,
      );

      expect(lote.cantidadRecibida).toBe(5);
      expect(lote.cantidadDisponible).toBe(5);
      expect(lote.fechaEntrada).toBe('2026-09-03');
    });

    it('debe rechazar recepción que supere la cantidad inicial con 400', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({
        idLote: 10,
        cantidadInicial: 10,
        cantidadRecibida: 7,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-05',
            detalles: [{ idLote: 10, cantidadRecibida: 4 }],
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe marcar pedido como RECIBIDO cuando todos los lotes estén completos', async () => {
      const pedido = crearPedido({
        idPedido: 1,
        fechaPedido: '2026-09-01',
        estado: 'EN_TRANSITO',
      });
      const lote = crearLote({
        idLote: 10,
        idPedido: 1,
        cantidadInicial: 10,
        cantidadRecibida: 5,
        cantidadDisponible: 5,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await service.recibir(
        1,
        {
          fechaRecepcion: '2026-09-08',
          detalles: [{ idLote: 10, cantidadRecibida: 5 }],
        },
        actor,
      );

      expect(pedido.estado).toBe('RECIBIDO');
      expect(pedido.fechaRecepcion).toBe('2026-09-08');
    });

    it('debe rechazar recepción en pedido CANCELADO con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'CANCELADO' });
      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      await expect(
        service.recibir(1, recepcionDto, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe rechazar recepción en pedido ya completamente RECIBIDO con 409', async () => {
      const pedido = crearPedido({ idPedido: 1, estado: 'RECIBIDO' });
      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      await expect(
        service.recibir(1, recepcionDto, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('debe rechazar lote duplicado en el mismo DTO con 400', async () => {
      const pedido = crearPedido({ idPedido: 1 });
      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-05',
            detalles: [
              { idLote: 10, cantidadRecibida: 1 },
              { idLote: 10, cantidadRecibida: 1 },
            ],
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe rechazar lote que no pertenezca al pedido con 400', async () => {
      const pedido = crearPedido({ idPedido: 1 });
      const lote = crearLote({ idLote: 10, idPedido: 1 });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-05',
            detalles: [{ idLote: 999, cantidadRecibida: 1 }],
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe rechazar fecha de recepción anterior a la fecha de pedido con 400', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-05' });
      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-04',
            detalles: [{ idLote: 10, cantidadRecibida: 1 }],
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe rechazar fecha de recepción anterior a la fechaEntrada previa del lote con 400', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({
        idLote: 10,
        cantidadInicial: 10,
        cantidadRecibida: 3,
        fechaEntrada: '2026-09-05',
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-04',
            detalles: [{ idLote: 10, cantidadRecibida: 1 }],
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe solicitar bloqueo pesimista pessimistic_write en Pedido y Lotes', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({ idLote: 10 });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await service.recibir(1, recepcionDto, actor);
      expect(pedidoQb.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(loteQb.setLock).toHaveBeenCalledWith('pessimistic_write');
    });

    it('debe mantener estado VENDIDO_PARCIAL cuando hay ventas previas entre recepciones', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({
        idLote: 10,
        cantidadInicial: 10,
        cantidadRecibida: 5,
        cantidadDisponible: 3,
        estadoLote: 'VENDIDO_PARCIAL',
        fechaEntrada: '2026-09-03',
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await service.recibir(
        1,
        {
          fechaRecepcion: '2026-09-05',
          detalles: [{ idLote: 10, cantidadRecibida: 2 }],
        },
        actor,
      );

      expect(lote.cantidadRecibida).toBe(7);
      expect(lote.cantidadDisponible).toBe(5);
      expect(lote.estadoLote).toBe('VENDIDO_PARCIAL');
    });

    it('32 & 33. debe registrar movimiento ENTRADA_COMPRA con cantidad incremental y actor', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        cantidadInicial: 10,
        cantidadRecibida: 3,
        cantidadDisponible: 3,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await service.recibir(
        1,
        {
          fechaRecepcion: '2026-09-05',
          detalles: [{ idLote: 10, cantidadRecibida: 2 }],
        },
        actor,
      );

      expect(inventarioServiceMock.registrarMovimiento).toHaveBeenCalledWith(
        managerMock,
        {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 2,
          referenciaId: 1,
          actor,
        },
      );
    });

    it('34. debe registrar un movimiento por cada lote en recepciones multi-lote', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote1 = crearLote({
        idLote: 10,
        cantidadInicial: 5,
        cantidadRecibida: 0,
        cantidadDisponible: 0,
      });
      const lote2 = crearLote({
        idLote: 11,
        cantidadInicial: 5,
        cantidadRecibida: 0,
        cantidadDisponible: 0,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote1, lote2]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      pedidosRepositoryMock.findOne.mockResolvedValue(pedido);

      await service.recibir(
        1,
        {
          fechaRecepcion: '2026-09-05',
          detalles: [
            { idLote: 10, cantidadRecibida: 3 },
            { idLote: 11, cantidadRecibida: 2 },
          ],
        },
        actor,
      );

      expect(inventarioServiceMock.registrarMovimiento).toHaveBeenCalledTimes(
        2,
      );
      expect(inventarioServiceMock.registrarMovimiento).toHaveBeenCalledWith(
        managerMock,
        {
          lote: lote1,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 3,
          referenciaId: 1,
          actor,
        },
      );
      expect(inventarioServiceMock.registrarMovimiento).toHaveBeenCalledWith(
        managerMock,
        {
          lote: lote2,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 2,
          referenciaId: 1,
          actor,
        },
      );
    });

    it('35 & 36. no debe llamar a registrarMovimiento si la validación falla (sobre-recepción o lote ajeno)', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({
        idLote: 10,
        cantidadInicial: 5,
        cantidadRecibida: 3,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-05',
            detalles: [{ idLote: 10, cantidadRecibida: 5 }],
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(inventarioServiceMock.registrarMovimiento).not.toHaveBeenCalled();
    });

    it('39. si falla registrarMovimiento debe propagar el error para provocar rollback', async () => {
      const pedido = crearPedido({ idPedido: 1, fechaPedido: '2026-09-01' });
      const lote = crearLote({
        idLote: 10,
        cantidadInicial: 10,
        cantidadRecibida: 0,
        cantidadDisponible: 0,
      });

      const pedidoQb: MockQueryBuilder = crearQueryBuilderMock();
      pedidoQb.getOne.mockResolvedValue(pedido);
      pedidosRepositoryMock.createQueryBuilder.mockReturnValue(
        qbWrapper(pedidoQb),
      );

      const loteQb: MockQueryBuilder = crearQueryBuilderMock();
      loteQb.getMany.mockResolvedValue([lote]);
      loteRepoMock.createQueryBuilder.mockReturnValue(qbWrapper(loteQb));

      inventarioServiceMock.registrarMovimiento.mockRejectedValue(
        new Error('Error simulado de movimiento'),
      );

      await expect(
        service.recibir(
          1,
          {
            fechaRecepcion: '2026-09-05',
            detalles: [{ idLote: 10, cantidadRecibida: 3 }],
          },
          actor,
        ),
      ).rejects.toThrow('Error simulado de movimiento');
    });
  });
});

function qbWrapper(qb: MockQueryBuilder): MockQueryBuilder {
  return qb;
}
