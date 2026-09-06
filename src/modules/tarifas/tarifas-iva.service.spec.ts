import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TarifasIvaService } from './tarifas-iva.service';
import { TarifaIva } from '../../database/entities/tarifa-iva.entity';
import { CreateTarifaIvaDto } from './dto/create-tarifa-iva.dto';

describe('TarifasIvaService', () => {
  let service: TarifasIvaService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TarifasIvaService,
        {
          provide: getRepositoryToken(TarifaIva),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TarifasIvaService>(TarifasIvaService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar un arreglo de tarifas ordenadas descendentemente', async () => {
      const mockResult = [{ idTarifaIva: 1, codigo: 'IVA' }];
      mockRepository.find.mockResolvedValue(mockResult);

      const result = await service.findAll();
      expect(result).toEqual(mockResult);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { idTarifaIva: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar una tarifa si existe', async () => {
      const mockTarifa = { idTarifaIva: 1, codigo: 'IVA' };
      mockRepository.findOne.mockResolvedValue(mockTarifa);

      const result = await service.findOne(1);
      expect(result).toEqual(mockTarifa);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { idTarifaIva: 1 },
      });
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe normalizar código a mayúsculas y crear tarifa si no existe duplicado', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const createDto: CreateTarifaIvaDto = {
        codigo: '  iva  ',
        porcentaje: 13,
        descripcion: '  Tarifa General  ',
        estado: 'ACTIVA',
      };

      const entidadCreada = {
        codigo: 'IVA',
        porcentaje: 13,
        descripcion: 'Tarifa General',
        estado: 'ACTIVA',
      };

      mockRepository.create.mockReturnValue(entidadCreada);
      mockRepository.save.mockResolvedValue({
        idTarifaIva: 1,
        ...entidadCreada,
      });

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(entidadCreada);
      expect(mockRepository.save).toHaveBeenCalledWith(entidadCreada);
      expect(result.idTarifaIva).toBe(1);
    });

    it('debe lanzar ConflictException si el código ya existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        idTarifaIva: 1,
        codigo: 'IVA',
      });

      const createDto: CreateTarifaIvaDto = {
        codigo: 'IVA',
        porcentaje: 13,
        descripcion: 'Duplicado',
        estado: 'ACTIVA',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar los campos y validar disponibilidad excluyendo su propio ID', async () => {
      const mockExistente = {
        idTarifaIva: 1,
        codigo: 'IVA',
        porcentaje: 13,
        descripcion: 'Anterior',
        estado: 'ACTIVA',
      };

      mockRepository.findOne.mockResolvedValue(mockExistente);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const updateDto = {
        porcentaje: 13.5,
        descripcion: 'Actualizada',
      };

      const result = await service.update(1, updateDto);

      expect(result.porcentaje).toBe(13.5);
      expect(result.descripcion).toBe('Actualizada');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si intenta cambiar el código a uno que ya pertenece a otro registro', async () => {
      const mockExistente = {
        idTarifaIva: 2,
        codigo: 'EXENTO',
        porcentaje: 0,
        estado: 'ACTIVA',
      };

      mockRepository.findOne.mockResolvedValue(mockExistente);
      mockQueryBuilder.getOne.mockResolvedValue({
        idTarifaIva: 1,
        codigo: 'IVA',
      });

      await expect(service.update(2, { codigo: 'IVA' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove (desactivación lógica)', () => {
    it('debe cambiar estado a INACTIVA sin borrar físicamente la fila', async () => {
      const mockExistente = {
        idTarifaIva: 1,
        codigo: 'IVA',
        estado: 'ACTIVA',
      };

      mockRepository.findOne.mockResolvedValue(mockExistente);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.remove(1);

      expect(mockExistente.estado).toBe('INACTIVA');
      expect(mockRepository.save).toHaveBeenCalledWith(mockExistente);
      expect(result).toEqual({
        message: 'Tarifa IVA desactivada correctamente',
        id: 1,
      });
    });
  });
});
