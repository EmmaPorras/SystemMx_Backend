import { Test, TestingModule } from '@nestjs/testing';
import { TarifasIvaController } from './tarifas-iva.controller';
import { TarifasIvaService } from './tarifas-iva.service';
import { CreateTarifaIvaDto } from './dto/create-tarifa-iva.dto';
import { UpdateTarifaIvaDto } from './dto/update-tarifa-iva.dto';

describe('TarifasIvaController', () => {
  let controller: TarifasIvaController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarifasIvaController],
      providers: [
        {
          provide: TarifasIvaService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TarifasIvaController>(TarifasIvaController);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('findAll debe delegar al service', async () => {
    mockService.findAll.mockResolvedValue([{ idTarifaIva: 1, codigo: 'IVA' }]);
    const result = await controller.findAll();
    expect(result).toEqual([{ idTarifaIva: 1, codigo: 'IVA' }]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('findOne debe delegar al service', async () => {
    mockService.findOne.mockResolvedValue({ idTarifaIva: 1, codigo: 'IVA' });
    const result = await controller.findOne(1);
    expect(result).toEqual({ idTarifaIva: 1, codigo: 'IVA' });
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('create debe delegar al service', async () => {
    const dto: CreateTarifaIvaDto = {
      codigo: 'IVA',
      porcentaje: 13,
      descripcion: 'General',
      estado: 'ACTIVA',
    };
    mockService.create.mockResolvedValue({ idTarifaIva: 1, ...dto });
    const result = await controller.create(dto);
    expect(result.idTarifaIva).toBe(1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('update debe delegar al service', async () => {
    const dto: UpdateTarifaIvaDto = { descripcion: 'Modificada' };
    mockService.update.mockResolvedValue({ idTarifaIva: 1, ...dto });
    const result = await controller.update(1, dto);
    expect(result.descripcion).toBe('Modificada');
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove debe delegar al service', async () => {
    mockService.remove.mockResolvedValue({
      message: 'Tarifa IVA desactivada correctamente',
      id: 1,
    });
    const result = await controller.remove(1);
    expect(result.id).toBe(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
