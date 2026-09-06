import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { Producto } from '../../database/entities/producto.entity';

describe('ProductosService', () => {
  let service: ProductosService;

  const mockProductoRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: getRepositoryToken(Producto),
          useValue: mockProductoRepository,
        },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll debe listar productos ordenados por nombre', async () => {
    const productos = [{ idProducto: 1, nombre: 'Aceite' }];
    mockProductoRepository.find.mockResolvedValue(productos);

    const resultado = await service.findAll();
    expect(mockProductoRepository.find).toHaveBeenCalledWith({
      relations: { categoria: true },
      order: { nombre: 'ASC' },
    });
    expect(resultado).toEqual(productos);
  });

  it('findOne debe retornar un producto si existe', async () => {
    const producto = { idProducto: 1, nombre: 'Aceite' };
    mockProductoRepository.findOne.mockResolvedValue(producto);

    const resultado = await service.findOne(1);
    expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
      where: { idProducto: 1 },
      relations: { categoria: true },
    });
    expect(resultado).toEqual(producto);
  });

  it('findOne debe lanzar 404 si el producto no existe', async () => {
    mockProductoRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
