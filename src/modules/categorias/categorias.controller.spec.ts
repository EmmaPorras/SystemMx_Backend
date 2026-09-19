import { Test, TestingModule } from '@nestjs/testing';

import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';

describe('CategoriasController', () => {
  let controller: CategoriasController;

  const categoriasServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasController],
      providers: [
        {
          provide: CategoriasService,
          useValue: categoriasServiceMock,
        },
      ],
    }).compile();

    controller = module.get<CategoriasController>(CategoriasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('debe listar categorías', async () => {
    const categorias = [
      {
        idCategoria: 1,
        nombre: 'Repuestos',
        activo: true,
      },
    ];

    categoriasServiceMock.findAll.mockResolvedValue(categorias);

    await expect(controller.findAll()).resolves.toEqual(categorias);

    expect(categoriasServiceMock.findAll).toHaveBeenCalled();
  });

  it('debe obtener una categoría por ID', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      activo: true,
    };

    categoriasServiceMock.findOne.mockResolvedValue(categoria);

    await expect(controller.findOne(1)).resolves.toEqual(categoria);

    expect(categoriasServiceMock.findOne).toHaveBeenCalledWith(1);
  });

  it('debe crear una categoría', async () => {
    const dto = {
      nombre: 'Repuestos',
      descripcion: 'Accesorios',
    };

    const categoria = {
      idCategoria: 1,
      ...dto,
      activo: true,
    };

    categoriasServiceMock.create.mockResolvedValue(categoria);

    await expect(controller.create(dto)).resolves.toEqual(categoria);

    expect(categoriasServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('debe actualizar una categoría', async () => {
    const dto = {
      descripcion: 'Actualizada',
    };

    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      descripcion: 'Actualizada',
      activo: true,
    };

    categoriasServiceMock.update.mockResolvedValue(categoria);

    await expect(controller.update(1, dto)).resolves.toEqual(categoria);

    expect(categoriasServiceMock.update).toHaveBeenCalledWith(1, dto);
  });

  it('debe desactivar una categoría', async () => {
    const respuesta = {
      message: 'Categoría desactivada correctamente',
      id: 1,
    };

    categoriasServiceMock.remove.mockResolvedValue(respuesta);

    await expect(controller.remove(1)).resolves.toEqual(respuesta);

    expect(categoriasServiceMock.remove).toHaveBeenCalledWith(1);
  });
});
