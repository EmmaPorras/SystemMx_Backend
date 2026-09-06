import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { Producto } from '../../database/entities/producto.entity';
import { ProductosService } from './productos.service';

describe('ProductosService', () => {
  let service: ProductosService;

  const queryBuilderMock = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    getRawMany: jest.fn(),
  };

  const productosRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const lotesRepositoryMock = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    queryBuilderMock.select.mockReturnValue(queryBuilderMock);
    queryBuilderMock.addSelect.mockReturnValue(queryBuilderMock);
    queryBuilderMock.where.mockReturnValue(queryBuilderMock);
    queryBuilderMock.groupBy.mockReturnValue(queryBuilderMock);
    queryBuilderMock.getRawMany.mockResolvedValue([]);

    lotesRepositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: getRepositoryToken(Producto),
          useValue: productosRepositoryMock,
        },
        {
          provide: getRepositoryToken(LoteProducto),
          useValue: lotesRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('1. findAll devuelve productos', async () => {
      const mockProductos = [
        {
          idProducto: 1,
          nombre: 'Aceite',
          categoria: null,
          tarifaIva: null,
        } as Producto,
      ];
      productosRepositoryMock.find.mockResolvedValue(mockProductos);
      queryBuilderMock.getRawMany.mockResolvedValue([
        { idProducto: 1, stockActual: 10 },
      ]);

      const resultado = await service.findAll();
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombre).toBe('Aceite');
    });

    it('2 & 3. findAll incluye categoria y tarifaIva en relations', async () => {
      productosRepositoryMock.find.mockResolvedValue([]);

      await service.findAll();
      expect(productosRepositoryMock.find).toHaveBeenCalledWith({
        relations: {
          categoria: true,
          tarifaIva: true,
        },
        order: {
          nombre: 'ASC',
        },
      });
    });

    it('4. findAll agrega stockActual', async () => {
      const mockProductos = [
        {
          idProducto: 6,
          nombre: 'Aceite recepción prueba',
          categoria: null,
          tarifaIva: null,
        } as Producto,
      ];
      productosRepositoryMock.find.mockResolvedValue(mockProductos);
      queryBuilderMock.getRawMany.mockResolvedValue([
        { idProducto: 6, stockActual: 10 },
      ]);

      const resultado = await service.findAll();
      expect(resultado[0].stockActual).toBe(10);
    });

    it('5. findAll producto sin lotes → stockActual 0', async () => {
      const mockProductos = [
        {
          idProducto: 10,
          nombre: 'Producto cancelado',
          categoria: null,
          tarifaIva: null,
        } as Producto,
      ];
      productosRepositoryMock.find.mockResolvedValue(mockProductos);
      queryBuilderMock.getRawMany.mockResolvedValue([]);

      const resultado = await service.findAll();
      expect(resultado[0].stockActual).toBe(0);
    });

    it('6. findAll consulta stocks una sola vez (evita N+1)', async () => {
      const mockProductos = [
        {
          idProducto: 1,
          nombre: 'A',
          categoria: null,
          tarifaIva: null,
        } as Producto,
        {
          idProducto: 2,
          nombre: 'B',
          categoria: null,
          tarifaIva: null,
        } as Producto,
        {
          idProducto: 3,
          nombre: 'C',
          categoria: null,
          tarifaIva: null,
        } as Producto,
      ];
      productosRepositoryMock.find.mockResolvedValue(mockProductos);
      queryBuilderMock.getRawMany.mockResolvedValue([
        { idProducto: 1, stockActual: 5 },
        { idProducto: 2, stockActual: 0 },
      ]);

      const resultado = await service.findAll();

      expect(lotesRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'lote.idProducto IN (:...productoIds)',
        { productoIds: [1, 2, 3] },
      );
      expect(resultado[0].stockActual).toBe(5);
      expect(resultado[1].stockActual).toBe(0);
      expect(resultado[2].stockActual).toBe(0);
    });

    it('12. lista vacía → [] sin consultar lotes', async () => {
      productosRepositoryMock.find.mockResolvedValue([]);

      const resultado = await service.findAll();
      expect(resultado).toEqual([]);
      expect(lotesRepositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('31. decimal o string retornado por SQL driver es convertido a número', async () => {
      const mockProductos = [
        {
          idProducto: 6,
          nombre: 'Aceite',
          categoria: null,
          tarifaIva: null,
        } as Producto,
      ];
      productosRepositoryMock.find.mockResolvedValue(mockProductos);
      queryBuilderMock.getRawMany.mockResolvedValue([
        { idProducto: '6', stockActual: '10' },
      ]);

      const resultado = await service.findAll();
      expect(resultado[0].stockActual).toBe(10);
      expect(typeof resultado[0].stockActual).toBe('number');
    });
  });

  describe('findOne', () => {
    it('7 & 8. findOne existente calcula stock e incluye relaciones', async () => {
      const mockProducto = {
        idProducto: 6,
        nombre: 'Aceite recepción prueba',
        categoria: null,
        tarifaIva: null,
      } as Producto;
      productosRepositoryMock.findOne.mockResolvedValue(mockProducto);
      queryBuilderMock.getRawMany.mockResolvedValue([
        { idProducto: 6, stockActual: 10 },
      ]);

      const resultado = await service.findOne(6);

      expect(productosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { idProducto: 6 },
        relations: {
          categoria: true,
          tarifaIva: true,
        },
      });
      expect(resultado).toEqual({
        ...mockProducto,
        stockActual: 10,
      });
    });

    it('9. findOne sin lotes → stock 0', async () => {
      const mockProducto = {
        idProducto: 1,
        nombre: 'Filtro sin stock',
        categoria: null,
        tarifaIva: null,
      } as Producto;
      productosRepositoryMock.findOne.mockResolvedValue(mockProducto);
      queryBuilderMock.getRawMany.mockResolvedValue([]);

      const resultado = await service.findOne(1);
      expect(resultado.stockActual).toBe(0);
    });

    it('10. findOne inexistente → 404 NotFoundException', async () => {
      productosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(999999)).rejects.toThrow(NotFoundException);
    });

    it('11. findOne ID inválido → 400 BadRequestException', async () => {
      await expect(service.findOne(0)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(-5)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(Number.NaN)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
