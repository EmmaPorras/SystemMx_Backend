import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';

describe('ProveedoresController', () => {
  let controller: ProveedoresController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProveedoresController],
      providers: [
        {
          provide: ProveedoresService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProveedoresController>(ProveedoresController);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('findAll debe delegar al service', async () => {
    mockService.findAll.mockResolvedValue([{ idOrigenCompra: 1 }]);
    const result = await controller.findAll();
    expect(result).toEqual([{ idOrigenCompra: 1 }]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('findOne debe delegar al service', async () => {
    mockService.findOne.mockResolvedValue({ idOrigenCompra: 1 });
    const result = await controller.findOne(1);
    expect(result).toEqual({ idOrigenCompra: 1 });
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('create debe delegar al service', async () => {
    const dto: CreateProveedorDto = {
      tipoOrigen: 'Proveedor',
      nombreReferencia: 'Prueba',
      telefono: '12345678',
      correo: 'test@correo.com',
      pais: 'Costa Rica',
      estado: 'ACTIVO',
    };
    mockService.create.mockResolvedValue({ idOrigenCompra: 1, ...dto });
    const result = await controller.create(dto);
    expect(result.idOrigenCompra).toBe(1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('update debe delegar al service', async () => {
    const dto = { nombreReferencia: 'Modificado' };
    mockService.update.mockResolvedValue({ idOrigenCompra: 1, ...dto });
    const result = await controller.update(1, dto);
    expect(result.nombreReferencia).toBe('Modificado');
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove debe delegar al service', async () => {
    mockService.remove.mockResolvedValue({
      message: 'Proveedor desactivado correctamente',
      id: 1,
    });
    const result = await controller.remove(1);
    expect(result.id).toBe(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
