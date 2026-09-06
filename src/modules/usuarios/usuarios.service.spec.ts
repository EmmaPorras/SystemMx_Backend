import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Usuario } from '../../database/entities/usuario.entity';
import { PasswordHasherService } from './password-hasher.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  const usuariosRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const passwordHasherMock = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: usuariosRepositoryMock,
        },
        {
          provide: PasswordHasherService,
          useValue: passwordHasherMock,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('crear()', () => {
    it('debe crear un usuario normalizando el username y hasheando la contraseña', async () => {
      const dto = {
        username: '  Admin.Taller  ',
        nombre: '  Administrador General  ',
        password: 'ClaveSegura12345',
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$v=19$hash-prueba');

      const nuevoUsuarioEntity: Usuario = {
        idUsuario: 1,
        username: 'Admin.Taller',
        usernameNormalizado: 'admin.taller',
        nombre: 'Administrador General',
        passwordHash: '$argon2id$v=19$hash-prueba',
        activo: true,
        createdAt: new Date('2026-09-06T10:00:00Z'),
        updatedAt: new Date('2026-09-06T10:00:00Z'),
      };

      usuariosRepositoryMock.create.mockReturnValue(nuevoUsuarioEntity);
      usuariosRepositoryMock.save.mockResolvedValue(nuevoUsuarioEntity);

      const resultado = await service.crear(dto);

      expect(usuariosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { usernameNormalizado: 'admin.taller' },
      });
      expect(passwordHasherMock.hash).toHaveBeenCalledWith('ClaveSegura12345');
      expect(usuariosRepositoryMock.create).toHaveBeenCalledWith({
        username: 'Admin.Taller',
        usernameNormalizado: 'admin.taller',
        nombre: 'Administrador General',
        passwordHash: '$argon2id$v=19$hash-prueba',
        activo: true,
      });

      expect(resultado).toEqual({
        idUsuario: 1,
        username: 'Admin.Taller',
        nombre: 'Administrador General',
        activo: true,
        createdAt: nuevoUsuarioEntity.createdAt,
        updatedAt: nuevoUsuarioEntity.updatedAt,
      });
      expect(resultado).not.toHaveProperty('passwordHash');
      expect(resultado).not.toHaveProperty('password');
      expect(resultado).not.toHaveProperty('usernameNormalizado');
    });

    it('debe rechazar la creación si el nombre tiene menos de 2 caracteres tras trim()', async () => {
      await expect(
        service.crear({
          username: 'admin.taller',
          nombre: ' a ',
          password: 'ClaveSegura12345',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe retornar 409 Conflict si el username normalizado ya existe', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue({
        idUsuario: 1,
        usernameNormalizado: 'admin.taller',
      });

      await expect(
        service.crear({
          username: 'ADMIN.TALLER',
          nombre: 'Administrador',
          password: 'ClaveSegura12345',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe convertir error de base de datos número 2601 (UNIQUE index) en 409 Conflict', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$hash');
      usuariosRepositoryMock.create.mockReturnValue({});
      usuariosRepositoryMock.save.mockRejectedValue({
        driverError: { number: 2601 },
      });

      await expect(
        service.crear({
          username: 'admin.taller',
          nombre: 'Administrador',
          password: 'ClaveSegura12345',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe convertir error de base de datos número 2627 (PRIMARY/UNIQUE constraint) en 409 Conflict', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$hash');
      usuariosRepositoryMock.create.mockReturnValue({});
      usuariosRepositoryMock.save.mockRejectedValue({
        driverError: { number: 2627 },
      });

      await expect(
        service.crear({
          username: 'admin.taller',
          nombre: 'Administrador',
          password: 'ClaveSegura12345',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll()', () => {
    it('debe listar usuarios ordenados por username ASC mapeando sin passwordHash', async () => {
      const lista: Usuario[] = [
        {
          idUsuario: 2,
          username: 'bernardo',
          usernameNormalizado: 'bernardo',
          nombre: 'Bernardo',
          passwordHash: '$argon2id$hashB',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          idUsuario: 1,
          username: 'carlos',
          usernameNormalizado: 'carlos',
          nombre: 'Carlos',
          passwordHash: '$argon2id$hashC',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      usuariosRepositoryMock.find.mockResolvedValue(lista);

      const resultado = await service.findAll();

      expect(usuariosRepositoryMock.find).toHaveBeenCalledWith({
        order: { username: 'ASC' },
      });
      expect(resultado).toHaveLength(2);
      expect(resultado[0]).not.toHaveProperty('passwordHash');
      expect(resultado[0].username).toBe('bernardo');
    });
  });

  describe('findOne()', () => {
    it('debe retornar el usuario mapeado para un ID existente', async () => {
      const usuario: Usuario = {
        idUsuario: 5,
        username: 'juan',
        usernameNormalizado: 'juan',
        nombre: 'Juan Perez',
        passwordHash: '$argon2id$hash',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(usuario);

      const resultado = await service.findOne(5);

      expect(resultado.idUsuario).toBe(5);
      expect(resultado).not.toHaveProperty('passwordHash');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el ID es 0, negativo o no entero', async () => {
      await expect(service.findOne(0)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(-1)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(1.5)).rejects.toThrow(BadRequestException);
    });
  });

  describe('buscarParaAutenticacion()', () => {
    it('debe normalizar username y seleccionar explícitamente passwordHash', async () => {
      const qbMock = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          idUsuario: 1,
          username: 'Admin.Taller',
          usernameNormalizado: 'admin.taller',
          passwordHash: '$argon2id$hash-secreto',
        }),
      };

      usuariosRepositoryMock.createQueryBuilder.mockReturnValue(qbMock);

      const resultado =
        await service.buscarParaAutenticacion('  ADMIN.TALLER  ');

      expect(usuariosRepositoryMock.createQueryBuilder).toHaveBeenCalledWith(
        'usuario',
      );
      expect(qbMock.addSelect).toHaveBeenCalledWith('usuario.passwordHash');
      expect(qbMock.where).toHaveBeenCalledWith(
        'usuario.usernameNormalizado = :usernameNormalizado',
        { usernameNormalizado: 'admin.taller' },
      );
      expect(resultado).toBeDefined();
      expect(resultado?.passwordHash).toBe('$argon2id$hash-secreto');
    });

    it('debe retornar null directamente si el username está vacío', async () => {
      const resultado = await service.buscarParaAutenticacion('   ');
      expect(resultado).toBeNull();
      expect(usuariosRepositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('cambiarPassword()', () => {
    it('debe re-hashear la nueva contraseña y actualizar el usuario', async () => {
      const usuario: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hashAnterior',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(usuario);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$hashNuevo');
      usuariosRepositoryMock.save.mockImplementation((u: Usuario) =>
        Promise.resolve(u),
      );

      const resultado = await service.cambiarPassword(
        1,
        'NuevaClaveSuperSegura123',
      );

      expect(passwordHasherMock.hash).toHaveBeenCalledWith(
        'NuevaClaveSuperSegura123',
      );
      expect(usuario.passwordHash).toBe('$argon2id$hashNuevo');
      expect(usuariosRepositoryMock.save).toHaveBeenCalledWith(usuario);
      expect(resultado).not.toHaveProperty('passwordHash');
    });

    it('debe lanzar BadRequestException si la contraseña tiene menos de 12 caracteres', async () => {
      await expect(service.cambiarPassword(1, 'corta123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si la contraseña supera 128 caracteres', async () => {
      await expect(service.cambiarPassword(1, 'a'.repeat(129))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe al cambiar contraseña', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.cambiarPassword(999, 'NuevaClaveSuperSegura123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cambiarEstado()', () => {
    it('debe desactivar un usuario cambiando activo a false', async () => {
      const usuario: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(usuario);
      usuariosRepositoryMock.save.mockImplementation((u: Usuario) =>
        Promise.resolve(u),
      );

      const resultado = await service.cambiarEstado(1, false);

      expect(usuario.activo).toBe(false);
      expect(resultado.activo).toBe(false);
    });

    it('debe reactivar un usuario cambiando activo a true', async () => {
      const usuario: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        activo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(usuario);
      usuariosRepositoryMock.save.mockImplementation((u: Usuario) =>
        Promise.resolve(u),
      );

      const resultado = await service.cambiarEstado(1, true);

      expect(usuario.activo).toBe(true);
      expect(resultado.activo).toBe(true);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.cambiarEstado(999, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si el estado no es booleano', async () => {
      await expect(
        // @ts-expect-error probando valor inválido
        service.cambiarEstado(1, 'activo'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
