import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { Categoria } from '../../database/entities/categoria.entity';
import { CategoriasService } from './categorias.service';

describe('CategoriasService', () => {
  let service: CategoriasService;

  const queryBuilderMock = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queryBuilderMock.where.mockReturnValue(queryBuilderMock);
    queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
    queryBuilderMock.getOne.mockResolvedValue(null);
    repositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
        {
          provide: getRepositoryToken(Categoria),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<CategoriasService>(CategoriasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('debe listar categorías ordenadas por nombre', async () => {
    const categorias = [
      {
        idCategoria: 1,
        nombre: 'Cascos',
        activo: true,
      },
      {
        idCategoria: 2,
        nombre: 'Repuestos',
        activo: true,
      },
    ] as Categoria[];

    repositoryMock.find.mockResolvedValue(categorias);

    const resultado = await service.findAll();

    expect(repositoryMock.find).toHaveBeenCalledWith({
      order: {
        nombre: 'ASC',
      },
    });

    expect(resultado).toEqual(categorias);
  });

  it('debe obtener una categoría por ID', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      activo: true,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);

    const resultado = await service.findOne(1);

    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        idCategoria: 1,
      },
    });

    expect(resultado).toEqual(categoria);
  });

  it('debe lanzar 404 si la categoría no existe', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('debe crear una categoría normalizando sus campos', async () => {
    const categoriaCreada = {
      idCategoria: 1,
      nombre: 'Repuestos',
      descripcion: 'Accesorios',
      activo: true,
    } as Categoria;

    queryBuilderMock.getOne.mockResolvedValue(null);

    repositoryMock.create.mockReturnValue(categoriaCreada);

    repositoryMock.save.mockResolvedValue(categoriaCreada);

    const resultado = await service.create({
      nombre: '  Repuestos  ',
      descripcion: '  Accesorios  ',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith({
      nombre: 'Repuestos',
      descripcion: 'Accesorios',
      activo: true,
    });

    expect(repositoryMock.save).toHaveBeenCalledWith(categoriaCreada);

    expect(resultado).toEqual(categoriaCreada);
  });

  it('debe convertir una descripción vacía en null', async () => {
    const categoria = {
      nombre: 'Repuestos',
      descripcion: null,
      activo: true,
    } as Categoria;

    queryBuilderMock.getOne.mockResolvedValue(null);

    repositoryMock.create.mockReturnValue(categoria);
    repositoryMock.save.mockResolvedValue(categoria);

    await service.create({
      nombre: 'Repuestos',
      descripcion: '   ',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith({
      nombre: 'Repuestos',
      descripcion: null,
      activo: true,
    });
  });

  it('debe lanzar 409 al crear un nombre duplicado', async () => {
    queryBuilderMock.getOne.mockResolvedValue({
      idCategoria: 1,
      nombre: 'Repuestos',
    });

    await expect(
      service.create({
        nombre: 'repuestos',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('debe actualizar una categoría', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      descripcion: null,
      activo: true,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);
    queryBuilderMock.getOne.mockResolvedValue(null);

    repositoryMock.save.mockImplementation((value) =>
      Promise.resolve(value as Categoria),
    );

    const resultado = await service.update(1, {
      nombre: '  Repuestos Generales  ',
      descripcion: '  Moto  ',
    });

    expect(resultado.nombre).toBe('Repuestos Generales');

    expect(resultado.descripcion).toBe('Moto');
  });

  it('debe excluir su propio ID al validar nombre en update', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      activo: true,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);
    queryBuilderMock.getOne.mockResolvedValue(null);

    repositoryMock.save.mockImplementation((value) =>
      Promise.resolve(value as Categoria),
    );

    await service.update(1, {
      nombre: 'Repuestos',
    });

    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'categoria.idCategoria <> :idExcluir',
      {
        idExcluir: 1,
      },
    );
  });

  it('debe lanzar 409 al actualizar a un nombre existente', async () => {
    const categoria = {
      idCategoria: 2,
      nombre: 'Cascos',
      activo: true,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);

    queryBuilderMock.getOne.mockResolvedValue({
      idCategoria: 1,
      nombre: 'Repuestos',
    });

    await expect(
      service.update(2, {
        nombre: 'Repuestos',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('debe permitir establecer descripción en null', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      descripcion: 'Anterior',
      activo: true,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);

    repositoryMock.save.mockImplementation((value) =>
      Promise.resolve(value as Categoria),
    );

    const resultado = await service.update(1, {
      descripcion: null,
    });

    expect(resultado.descripcion).toBeNull();
  });

  it('debe desactivar una categoría sin eliminarla', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      activo: true,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);
    repositoryMock.save.mockResolvedValue(categoria);

    const resultado = await service.remove(1);

    expect(categoria.activo).toBe(false);

    expect(repositoryMock.save).toHaveBeenCalledWith(categoria);

    expect(resultado).toEqual({
      message: 'Categoría desactivada correctamente',
      id: 1,
    });
  });

  it('debe permitir reactivar una categoría', async () => {
    const categoria = {
      idCategoria: 1,
      nombre: 'Repuestos',
      activo: false,
    } as Categoria;

    repositoryMock.findOne.mockResolvedValue(categoria);

    repositoryMock.save.mockImplementation((value) =>
      Promise.resolve(value as Categoria),
    );

    const resultado = await service.update(1, {
      activo: true,
    });

    expect(resultado.activo).toBe(true);
  });
});
