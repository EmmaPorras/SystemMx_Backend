import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';

describe('ProveedoresService', () => {
  let service: ProveedoresService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        {
          provide: getRepositoryToken(OrigenCompra),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProveedoresService>(ProveedoresService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar un arreglo de proveedores ordenados descendentemente', async () => {
      const mockResult = [
        { idOrigenCompra: 1, nombreReferencia: 'Proveedor 1' },
      ];
      mockRepository.find.mockResolvedValue(mockResult);

      const result = await service.findAll();
      expect(result).toEqual(mockResult);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { idOrigenCompra: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar un proveedor si existe', async () => {
      const mockProveedor = {
        idOrigenCompra: 1,
        nombreReferencia: 'Proveedor 1',
      };
      mockRepository.findOne.mockResolvedValue(mockProveedor);

      const result = await service.findOne(1);
      expect(result).toEqual(mockProveedor);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { idOrigenCompra: 1 },
      });
    });

    it('debe lanzar NotFoundException si no existe el proveedor', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe normalizar y crear un proveedor correctamente', async () => {
      const createDto = {
        tipoOrigen: '  Proveedor  ',
        nombreReferencia: '  Repuestos S.A.  ',
        telefono: ' +506 8888-8888 ',
        correo: '  TEST@CORREO.COM  ',
        pais: '  Costa Rica  ',
        direccion: '  Calle Principal  ',
        estado: 'ACTIVO',
        contacto: '  Juan Perez  ',
        monedaPreferida: ' crc ',
        observaciones: '  Sin observaciones  ',
      };

      const entidadCreada = {
        tipoOrigen: 'Proveedor',
        nombreReferencia: 'Repuestos S.A.',
        telefono: '+506 8888-8888',
        correo: 'test@correo.com',
        pais: 'Costa Rica',
        direccion: 'Calle Principal',
        estado: 'ACTIVO',
        contacto: 'Juan Perez',
        monedaPreferida: 'CRC',
        observaciones: 'Sin observaciones',
      };

      mockRepository.create.mockReturnValue(entidadCreada);
      mockRepository.save.mockResolvedValue({
        idOrigenCompra: 1,
        ...entidadCreada,
      });

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(entidadCreada);
      expect(mockRepository.save).toHaveBeenCalledWith(entidadCreada);
      expect(result.idOrigenCompra).toBe(1);
    });
  });

  describe('update', () => {
    it('debe actualizar los campos provistos y guardar', async () => {
      const mockExistente = {
        idOrigenCompra: 1,
        tipoOrigen: 'Proveedor',
        nombreReferencia: 'Anterior',
        telefono: '+506 1111-1111',
        correo: 'old@correo.com',
        pais: 'Costa Rica',
        estado: 'ACTIVO',
      };

      mockRepository.findOne.mockResolvedValue(mockExistente);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const updateDto = {
        nombreReferencia: '  Nuevo Nombre  ',
        telefono: '+506 2222-2222',
      };

      const result = await service.update(1, updateDto);

      expect(result.nombreReferencia).toBe('Nuevo Nombre');
      expect(result.telefono).toBe('+506 2222-2222');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove (desactivación lógica)', () => {
    it('debe cambiar el estado a INACTIVO sin borrar físicamente la fila', async () => {
      const mockExistente = {
        idOrigenCompra: 1,
        nombreReferencia: 'Proveedor Activo',
        estado: 'ACTIVO',
      };

      mockRepository.findOne.mockResolvedValue(mockExistente);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.remove(1);

      expect(mockExistente.estado).toBe('INACTIVO');
      expect(mockRepository.save).toHaveBeenCalledWith(mockExistente);
      expect(result).toEqual({
        message: 'Proveedor desactivado correctamente',
        id: 1,
      });
    });
  });
});
