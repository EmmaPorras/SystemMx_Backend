import { Test, TestingModule } from '@nestjs/testing';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';

describe('ProductosController', () => {
  let controller: ProductosController;

  const mockProductosService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductosController],
      providers: [
        {
          provide: ProductosService,
          useValue: mockProductosService,
        },
      ],
    }).compile();

    controller = module.get<ProductosController>(ProductosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll debe delegar a service.findAll', async () => {
    const productos = [{ idProducto: 1, nombre: 'Aceite' }];
    mockProductosService.findAll.mockResolvedValue(productos);

    const resultado = await controller.findAll();
    expect(mockProductosService.findAll).toHaveBeenCalled();
    expect(resultado).toEqual(productos);
  });

  it('findOne debe delegar a service.findOne', async () => {
    const producto = { idProducto: 1, nombre: 'Aceite' };
    mockProductosService.findOne.mockResolvedValue(producto);

    const resultado = await controller.findOne(1);
    expect(mockProductosService.findOne).toHaveBeenCalledWith(1);
    expect(resultado).toEqual(producto);
  });
});
