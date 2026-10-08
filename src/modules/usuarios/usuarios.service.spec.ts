import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PasswordHasherService } from './password-hasher.service';
import { RolUsuario } from './rol-usuario.enum';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  const usuariosRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const passwordHasherMock = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  let mockTransactionManager: {
    getRepository: jest.Mock;
    save: jest.Mock;
  };

  const tokenAccionRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'SYSTEMMX_FRONTEND_URL') return 'https://systemmx-web-200684331.onrender.com';
      if (key === 'SYSTEMMX_INVITACION_EXPIRES_HOURS') return '24';
      if (key === 'SYSTEMMX_RECUPERACION_EXPIRES_MINUTES') return '30';
      return null;
    }),
  };

  const mailServiceMock = {
    enviarCorreoAccion: jest.fn().mockResolvedValue({ exito: true, proveedor: 'simulado' }),
  };

  const dataSourceMock = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTransactionManager = {
      getRepository: jest.fn(),
      save: jest.fn(),
    };

    dataSourceMock.transaction.mockImplementation(
      async (cb: (manager: EntityManager) => Promise<unknown>) => {
        return cb(mockTransactionManager as unknown as EntityManager);
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: usuariosRepositoryMock,
        },
        {
          provide: getRepositoryToken(TokenAccionUsuario),
          useValue: tokenAccionRepositoryMock,
        },
        {
          provide: PasswordHasherService,
          useValue: passwordHasherMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('crear()', () => {
    it('debe crear un usuario normalizando el username, hasheando la contraseña y asignando el rol', async () => {
      const dto = {
        username: '  Operador.Taller  ',
        nombre: '  Operador General  ',
        password: 'ClaveSegura12345',
        rol: RolUsuario.OPERADOR,
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$v=19$hash-prueba');

      const nuevoUsuarioEntity: Usuario = {
        idUsuario: 2,
        username: 'Operador.Taller',
        usernameNormalizado: 'operador.taller',
        nombre: 'Operador General',
        passwordHash: '$argon2id$v=19$hash-prueba',
        rol: RolUsuario.OPERADOR,
        activo: true,
        createdAt: new Date('2026-09-06T10:00:00Z'),
        updatedAt: new Date('2026-09-06T10:00:00Z'),
      };

      usuariosRepositoryMock.create.mockReturnValue(nuevoUsuarioEntity);
      usuariosRepositoryMock.save.mockResolvedValue(nuevoUsuarioEntity);

      const resultado = await service.crear(dto);

      expect(usuariosRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { usernameNormalizado: 'operador.taller' },
      });
      expect(passwordHasherMock.hash).toHaveBeenCalledWith('ClaveSegura12345');
      expect(usuariosRepositoryMock.create).toHaveBeenCalledWith({
        username: 'Operador.Taller',
        usernameNormalizado: 'operador.taller',
        nombre: 'Operador General',
        passwordHash: '$argon2id$v=19$hash-prueba',
        rol: RolUsuario.OPERADOR,
        activo: true,
      });

      expect(resultado).toEqual({
        idUsuario: 2,
        username: 'Operador.Taller',
        nombre: 'Operador General',
        rol: RolUsuario.OPERADOR,
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
          rol: RolUsuario.ADMIN,
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
          rol: RolUsuario.ADMIN,
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
          rol: RolUsuario.ADMIN,
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
          rol: RolUsuario.ADMIN,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll()', () => {
    it('debe listar usuarios ordenados por username ASC mapeando sin passwordHash y con rol', async () => {
      const lista: Usuario[] = [
        {
          idUsuario: 2,
          username: 'bernardo',
          usernameNormalizado: 'bernardo',
          nombre: 'Bernardo',
          passwordHash: '$argon2id$hashB',
          rol: RolUsuario.OPERADOR,
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
          rol: RolUsuario.ADMIN,
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
      expect(resultado[0].rol).toBe(RolUsuario.OPERADOR);
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
        rol: RolUsuario.CONSULTA,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(usuario);

      const resultado = await service.findOne(5);

      expect(resultado.idUsuario).toBe(5);
      expect(resultado.rol).toBe(RolUsuario.CONSULTA);
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
          rol: RolUsuario.ADMIN,
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

  describe('buscarParaSesion()', () => {
    it('debe retornar usuario público y versionCredenciales sin exponer passwordHash', async () => {
      const usuario: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Administrador',
        passwordHash: '$argon2id$hash-secreto',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usuariosRepositoryMock.findOne.mockResolvedValue(usuario);

      const resultado = await service.buscarParaSesion(1);

      expect(resultado).toBeDefined();
      expect(resultado?.usuario.idUsuario).toBe(1);
      expect(resultado?.usuario.username).toBe('admin');
      expect(resultado?.usuario.rol).toBe(RolUsuario.ADMIN);
      expect(resultado?.versionCredenciales).toBe(3);
      expect(resultado).not.toHaveProperty('passwordHash');
      expect(resultado?.usuario).not.toHaveProperty('passwordHash');
    });

    it('debe retornar null si el usuario no existe', async () => {
      usuariosRepositoryMock.findOne.mockResolvedValue(null);

      const resultado = await service.buscarParaSesion(999);
      expect(resultado).toBeNull();
    });

    it('debe retornar null si el ID es 0, negativo o inválido', async () => {
      expect(await service.buscarParaSesion(0)).toBeNull();
      expect(await service.buscarParaSesion(-5)).toBeNull();
      expect(await service.buscarParaSesion(1.5)).toBeNull();
    });
  });

  describe('cambiarPassword()', () => {
    const setupPasswordRepoTransaction = (targetUsuario: Usuario | null) => {
      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(targetUsuario),
      };

      const repoMock = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
        save: jest.fn().mockImplementation((u: Usuario) => Promise.resolve(u)),
      };

      mockTransactionManager.getRepository.mockReturnValue(repoMock);
      return { repoMock, qb };
    };

    it('debe re-hashear la nueva contraseña, aplicar pessimistic_write lock e incrementar versionCredenciales', async () => {
      const usuario: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hashAnterior',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { repoMock, qb } = setupPasswordRepoTransaction(usuario);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$hashNuevo');

      const resultado = await service.cambiarPassword(
        1,
        'NuevaClaveSuperSegura123',
      );

      expect(passwordHasherMock.hash).toHaveBeenCalledWith(
        'NuevaClaveSuperSegura123',
      );
      expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(usuario.passwordHash).toBe('$argon2id$hashNuevo');
      expect(usuario.versionCredenciales).toBe(2);
      expect(repoMock.save).toHaveBeenCalledWith(usuario);
      expect(resultado).not.toHaveProperty('passwordHash');
    });

    it('debe incrementar versionCredenciales consecutivamente en múltiples cambios (1 -> 2 -> 3)', async () => {
      const usuario: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash1',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupPasswordRepoTransaction(usuario);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$hash2');

      await service.cambiarPassword(1, 'NuevaClaveSuperSegura123');
      expect(usuario.versionCredenciales).toBe(2);

      passwordHasherMock.hash.mockResolvedValue('$argon2id$hash3');
      await service.cambiarPassword(1, 'OtraClaveSuperSegura456');
      expect(usuario.versionCredenciales).toBe(3);
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
      setupPasswordRepoTransaction(null);
      passwordHasherMock.hash.mockResolvedValue('$argon2id$hash');

      await expect(
        service.cambiarPassword(999, 'NuevaClaveSuperSegura123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cambiarEstado()', () => {
    const setupRepoTransaction = (
      adminsActivos: Usuario[],
      targetUsuario: Usuario | null,
    ) => {
      const repoMock = {
        createQueryBuilder: jest.fn().mockImplementation(() => {
          let lockType = '';
          let orderField = '';
          let orderDir = '';

          const qb = {
            setLock: jest.fn().mockImplementation((type: string) => {
              lockType = type;
              return qb;
            }),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest
              .fn()
              .mockImplementation((field: string, dir: string) => {
                orderField = field;
                orderDir = dir;
                return qb;
              }),
            getMany: jest.fn().mockImplementation(() => {
              expect(lockType).toBe('pessimistic_write');
              expect(orderField).toBe('usuario.idUsuario');
              expect(orderDir).toBe('ASC');
              return Promise.resolve(adminsActivos);
            }),
            getOne: jest.fn().mockImplementation(() => {
              expect(lockType).toBe('pessimistic_write');
              return Promise.resolve(targetUsuario);
            }),
          };
          return qb;
        }),
        save: jest.fn().mockImplementation((u: Usuario) => Promise.resolve(u)),
      };

      mockTransactionManager.getRepository.mockReturnValue(repoMock);
      return repoMock;
    };

    it('debe desactivar un operador, incrementar versionCredenciales y no afectar el conteo de admins', async () => {
      const adminActivo: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const operador: Usuario = {
        idUsuario: 2,
        username: 'operador',
        usernameNormalizado: 'operador',
        nombre: 'Operador',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.OPERADOR,
        activo: true,
        versionCredenciales: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoMock = setupRepoTransaction([adminActivo], operador);

      const resultado = await service.cambiarEstado(2, false);

      expect(operador.activo).toBe(false);
      expect(operador.versionCredenciales).toBe(4);
      expect(repoMock.save).toHaveBeenCalledWith(operador);
      expect(resultado.activo).toBe(false);
    });

    it('al reactivar usuario no debe incrementar versionCredenciales (mantiene versión)', async () => {
      const adminActivo: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const operadorInactivo: Usuario = {
        idUsuario: 2,
        username: 'operador',
        usernameNormalizado: 'operador',
        nombre: 'Operador',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.OPERADOR,
        activo: false,
        versionCredenciales: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoMock = setupRepoTransaction([adminActivo], operadorInactivo);

      const resultado = await service.cambiarEstado(2, true);

      expect(operadorInactivo.activo).toBe(true);
      expect(operadorInactivo.versionCredenciales).toBe(4);
      expect(repoMock.save).toHaveBeenCalledWith(operadorInactivo);
      expect(resultado.activo).toBe(true);
    });

    it('debe lanzar ConflictException si se intenta desactivar el último ADMIN activo', async () => {
      const unicoAdmin: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupRepoTransaction([unicoAdmin], unicoAdmin);

      await expect(service.cambiarEstado(1, false)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe permitir desactivar un ADMIN si existen 2 o más admins activos', async () => {
      const admin1: Usuario = {
        idUsuario: 1,
        username: 'admin1',
        usernameNormalizado: 'admin1',
        nombre: 'Admin Uno',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const admin2: Usuario = {
        idUsuario: 2,
        username: 'admin2',
        usernameNormalizado: 'admin2',
        nombre: 'Admin Dos',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoMock = setupRepoTransaction([admin1, admin2], admin1);

      const resultado = await service.cambiarEstado(1, false);

      expect(admin1.activo).toBe(false);
      expect(admin1.versionCredenciales).toBe(2);
      expect(repoMock.save).toHaveBeenCalledWith(admin1);
      expect(resultado.activo).toBe(false);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      setupRepoTransaction([], null);

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

  describe('cambiarRol()', () => {
    const setupRepoTransaction = (
      adminsActivos: Usuario[],
      targetUsuario: Usuario | null,
    ) => {
      const repoMock = {
        createQueryBuilder: jest.fn().mockImplementation(() => {
          let lockType = '';
          let orderField = '';
          let orderDir = '';

          const qb = {
            setLock: jest.fn().mockImplementation((type: string) => {
              lockType = type;
              return qb;
            }),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest
              .fn()
              .mockImplementation((field: string, dir: string) => {
                orderField = field;
                orderDir = dir;
                return qb;
              }),
            getMany: jest.fn().mockImplementation(() => {
              expect(lockType).toBe('pessimistic_write');
              expect(orderField).toBe('usuario.idUsuario');
              expect(orderDir).toBe('ASC');
              return Promise.resolve(adminsActivos);
            }),
            getOne: jest.fn().mockImplementation(() => {
              expect(lockType).toBe('pessimistic_write');
              return Promise.resolve(targetUsuario);
            }),
          };
          return qb;
        }),
        save: jest.fn().mockImplementation((u: Usuario) => Promise.resolve(u)),
      };

      mockTransactionManager.getRepository.mockReturnValue(repoMock);
      return repoMock;
    };

    it('debe cambiar de OPERADOR a CONSULTA correctamente', async () => {
      const adminActivo: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const operador: Usuario = {
        idUsuario: 2,
        username: 'operador',
        usernameNormalizado: 'operador',
        nombre: 'Operador',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.OPERADOR,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoMock = setupRepoTransaction([adminActivo], operador);

      const resultado = await service.cambiarRol(2, RolUsuario.CONSULTA);

      expect(operador.rol).toBe(RolUsuario.CONSULTA);
      expect(repoMock.save).toHaveBeenCalledWith(operador);
      expect(resultado.rol).toBe(RolUsuario.CONSULTA);
    });

    it('debe cambiar de CONSULTA a ADMIN correctamente', async () => {
      const adminActivo: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const consulta: Usuario = {
        idUsuario: 3,
        username: 'consulta',
        usernameNormalizado: 'consulta',
        nombre: 'Consulta',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.CONSULTA,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoMock = setupRepoTransaction([adminActivo], consulta);

      const resultado = await service.cambiarRol(3, RolUsuario.ADMIN);

      expect(consulta.rol).toBe(RolUsuario.ADMIN);
      expect(repoMock.save).toHaveBeenCalledWith(consulta);
      expect(resultado.rol).toBe(RolUsuario.ADMIN);
    });

    it('debe lanzar ConflictException si se intenta degradar al último ADMIN activo (ADMIN -> OPERADOR)', async () => {
      const unicoAdmin: Usuario = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Admin',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupRepoTransaction([unicoAdmin], unicoAdmin);

      await expect(service.cambiarRol(1, RolUsuario.OPERADOR)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe permitir degradar un ADMIN si existen 2 o más admins activos', async () => {
      const admin1: Usuario = {
        idUsuario: 1,
        username: 'admin1',
        usernameNormalizado: 'admin1',
        nombre: 'Admin Uno',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const admin2: Usuario = {
        idUsuario: 2,
        username: 'admin2',
        usernameNormalizado: 'admin2',
        nombre: 'Admin Dos',
        passwordHash: '$argon2id$hash',
        rol: RolUsuario.ADMIN,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoMock = setupRepoTransaction([admin1, admin2], admin1);

      const resultado = await service.cambiarRol(1, RolUsuario.OPERADOR);

      expect(admin1.rol).toBe(RolUsuario.OPERADOR);
      expect(repoMock.save).toHaveBeenCalledWith(admin1);
      expect(resultado.rol).toBe(RolUsuario.OPERADOR);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      setupRepoTransaction([], null);

      await expect(
        service.cambiarRol(999, RolUsuario.OPERADOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el rol es inválido', async () => {
      await expect(
        // @ts-expect-error probando valor inválido
        service.cambiarRol(1, 'ROL_INVALIDO'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('contarUsuarios()', () => {
    it('debe delegar el conteo al repositorio de usuarios', async () => {
      usuariosRepositoryMock.count = jest.fn().mockResolvedValue(3);

      const total = await service.contarUsuarios();

      expect(usuariosRepositoryMock.count).toHaveBeenCalled();
      expect(total).toBe(3);
    });
  });
});
