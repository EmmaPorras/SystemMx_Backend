import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

import { UsuariosService } from './usuarios.service';
import { MailService } from '../mail/mail.service';
import { PasswordHasherService } from './password-hasher.service';
import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { RolUsuario } from './rol-usuario.enum';
import { EstadoActivacionUsuario } from './estado-activacion.enum';
import { TipoTokenAccion } from './tipo-token-accion.enum';

describe('UsuariosService - Invitaciones, Activación y Recuperación Transaccional', () => {
  let service: UsuariosService;

  const mockUsuarioRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTokenRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPasswordHasher = {
    hash: jest.fn().mockResolvedValue(''),
    verify: jest.fn(),
  };

  const mockMailService = {
    enviarCorreoAccion: jest.fn().mockResolvedValue({ exito: true, proveedor: 'google_apps_script' }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SYSTEMMX_FRONTEND_URL') return 'https://systemmx-web-200684331.onrender.com';
      if (key === 'SYSTEMMX_INVITACION_EXPIRES_HOURS') return '24';
      if (key === 'SYSTEMMX_RECUPERACION_EXPIRES_MINUTES') return '30';
      return null;
    }),
  };

  let tokenQbMock: any;
  let userQbMock: any;
  let userRepoSaveMock: any;

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => {
      const userRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(userQbMock),
        save: userRepoSaveMock,
      };
      const tokenRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(tokenQbMock),
      };
      return cb({
        getRepository: (entity: any) => (entity === Usuario ? userRepo : tokenRepo),
      });
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    userRepoSaveMock = jest.fn(async (u) => u);

    tokenQbMock = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    userQbMock = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
        { provide: getRepositoryToken(TokenAccionUsuario), useValue: mockTokenRepo },
        { provide: PasswordHasherService, useValue: mockPasswordHasher },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  describe('invitar()', () => {
    it('debe crear un usuario con estado PENDIENTE_ACTIVACION, generar token y enviar correo', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue(null);
      const usuarioGuardado = {
        idUsuario: 10,
        username: 'juanito24',
        usernameNormalizado: 'juanito24',
        email: 'juanito@gmail.com',
        emailNormalizado: 'juanito@gmail.com',
        nombre: 'Juanito',
        rol: RolUsuario.OPERADOR,
        activo: true,
        estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsuarioRepo.create.mockReturnValue(usuarioGuardado);
      mockUsuarioRepo.save.mockResolvedValue(usuarioGuardado);

      const tokenGuardado = { idToken: 1 };
      mockTokenRepo.create.mockReturnValue(tokenGuardado);
      mockTokenRepo.save.mockResolvedValue(tokenGuardado);

      const res = await service.invitar({
        username: 'juanito24',
        email: 'juanito@gmail.com',
        nombre: 'Juanito',
        rol: RolUsuario.OPERADOR,
        lang: 'es',
      });

      expect(res.usuario.estadoActivacion).toBe(EstadoActivacionUsuario.PENDIENTE_ACTIVACION);
      expect(mockTokenRepo.save).toHaveBeenCalled();
      expect(mockMailService.enviarCorreoAccion).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'juanito@gmail.com',
          type: 'INVITACION',
          recipientName: 'Juanito',
        }),
      );
    });

    it('debe rechazar si el username ya está registrado', async () => {
      mockUsuarioRepo.findOne.mockResolvedValueOnce({ idUsuario: 1 });

      await expect(
        service.invitar({
          username: 'juanito24',
          email: 'juanito@gmail.com',
          nombre: 'Juanito',
          rol: RolUsuario.OPERADOR,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar si el correo ya está registrado', async () => {
      mockUsuarioRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ idUsuario: 2 });

      await expect(
        service.invitar({
          username: 'juanito24',
          email: 'juanito@gmail.com',
          nombre: 'Juanito',
          rol: RolUsuario.OPERADOR,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe reportar error claro si el proveedor de correos falla', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue(null);
      const usuarioGuardado = {
        idUsuario: 10,
        username: 'juanito24',
        email: 'juanito@gmail.com',
        nombre: 'Juanito',
        rol: RolUsuario.OPERADOR,
        activo: true,
        estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
      };
      mockUsuarioRepo.create.mockReturnValue(usuarioGuardado);
      mockUsuarioRepo.save.mockResolvedValue(usuarioGuardado);
      mockTokenRepo.create.mockReturnValue({});
      mockTokenRepo.save.mockResolvedValue({});

      mockMailService.enviarCorreoAccion.mockRejectedValueOnce(new Error('Fallo conexión Google Apps Script'));

      await expect(
        service.invitar({
          username: 'juanito24',
          email: 'juanito@gmail.com',
          nombre: 'Juanito',
          rol: RolUsuario.OPERADOR,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validarTokenAccion()', () => {
    it('debe validar exitosamente un token activo no expirado', async () => {
      const tokenHash = crypto.createHash('sha256').update('mi-token-secreto').digest('hex');
      const tokenEntity = {
        idToken: 1,
        tokenHash,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
        expiraEn: new Date(Date.now() + 100000),
        usuario: { activo: true, idUsuario: 5 },
      };
      mockTokenRepo.findOne.mockResolvedValue(tokenEntity);

      const resultado = await service.validarTokenAccion('mi-token-secreto', TipoTokenAccion.INVITACION);
      expect(resultado).toBe(tokenEntity);
    });

    it('debe rechazar un token ya usado', async () => {
      mockTokenRepo.findOne.mockResolvedValue({
        usado: true,
        expiraEn: new Date(Date.now() + 100000),
      });

      await expect(
        service.validarTokenAccion('token-usado', TipoTokenAccion.INVITACION),
      ).rejects.toThrow('Este enlace ya ha sido utilizado.');
    });

    it('debe rechazar un token expirado', async () => {
      mockTokenRepo.findOne.mockResolvedValue({
        usado: false,
        expiraEn: new Date(Date.now() - 5000),
      });

      await expect(
        service.validarTokenAccion('token-expirado', TipoTokenAccion.INVITACION),
      ).rejects.toThrow('Este enlace ha expirado.');
    });
  });

  describe('reenviarInvitacion()', () => {
    it('debe invalidar tokens previos y reenviar la invitación', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({
        idUsuario: 12,
        email: 'juanito@gmail.com',
        nombre: 'Juanito',
        estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
      });
      mockTokenRepo.findOne.mockResolvedValue(null);
      mockTokenRepo.create.mockReturnValue({});
      mockTokenRepo.save.mockResolvedValue({});

      const res = await service.reenviarInvitacion(12);

      expect(mockTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ idUsuario: 12, tipo: TipoTokenAccion.INVITACION, usado: false }),
        expect.objectContaining({ usado: true }),
      );
      expect(mockMailService.enviarCorreoAccion).toHaveBeenCalled();
      expect(res.mensaje).toContain('Invitación reenviada exitosamente');
    });

    it('debe rechazar si el usuario ya está activo', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({
        idUsuario: 12,
        estadoActivacion: EstadoActivacionUsuario.ACTIVO,
      });

      await expect(service.reenviarInvitacion(12)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Consumo Atómico Transaccional de Tokens', () => {
    const rawToken = 'mi_token_de_prueba_1234567890';
    const nuevaPasswordValida = 'PasswordSegura2026!';

    it('activarCuentaConToken: debe aplicar pessimistic_write, UPDATE condicional, marcar ACTIVO e incrementar versionCredenciales', async () => {
      const mockTokenEntity = {
        idToken: 77,
        idUsuario: 5,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
        expiraEn: new Date(Date.now() + 3600000),
      };

      const mockUserEntity = {
        idUsuario: 5,
        nombre: 'Juan',
        activo: true,
        estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
        versionCredenciales: 1,
        passwordHash: 'hash-antiguo',
      };

      tokenQbMock.getOne.mockResolvedValue(mockTokenEntity);
      userQbMock.getOne.mockResolvedValue(mockUserEntity);
      tokenQbMock.execute.mockResolvedValue({ affected: 1 });

      const res = await service.activarCuentaConToken(rawToken, nuevaPasswordValida);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(tokenQbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(userQbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(tokenQbMock.update).toHaveBeenCalled();
      expect(mockUserEntity.estadoActivacion).toBe(EstadoActivacionUsuario.ACTIVO);
      expect(mockUserEntity.versionCredenciales).toBe(2);
      expect(mockUserEntity.passwordHash).toBe('');
      expect(userRepoSaveMock).toHaveBeenCalledWith(mockUserEntity);
      expect(res.success).toBe(true);
      expect(res.mensaje).toContain('Cuenta activada exitosamente');
    });

    it('activarCuentaConToken: debe fallar si el token no existe', async () => {
      tokenQbMock.getOne.mockResolvedValue(null);

      await expect(
        service.activarCuentaConToken(rawToken, nuevaPasswordValida),
      ).rejects.toThrow('El enlace es inválido o no existe.');
      expect(userRepoSaveMock).not.toHaveBeenCalled();
    });

    it('activarCuentaConToken: debe fallar si el tipo de token es incorrecto (RECUPERACION en lugar de INVITACION)', async () => {
      tokenQbMock.getOne.mockResolvedValue({
        idToken: 77,
        idUsuario: 5,
        tipo: TipoTokenAccion.RECUPERACION_PASSWORD,
        usado: false,
        expiraEn: new Date(Date.now() + 3600000),
      });

      await expect(
        service.activarCuentaConToken(rawToken, nuevaPasswordValida),
      ).rejects.toThrow('Tipo de enlace inválido.');
      expect(userRepoSaveMock).not.toHaveBeenCalled();
    });

    it('activarCuentaConToken: debe fallar si el token ya está marcado como usado', async () => {
      tokenQbMock.getOne.mockResolvedValue({
        idToken: 77,
        idUsuario: 5,
        tipo: TipoTokenAccion.INVITACION,
        usado: true,
        expiraEn: new Date(Date.now() + 3600000),
      });

      await expect(
        service.activarCuentaConToken(rawToken, nuevaPasswordValida),
      ).rejects.toThrow('Este enlace ya ha sido utilizado.');
      expect(userRepoSaveMock).not.toHaveBeenCalled();
    });

    it('activarCuentaConToken: debe fallar si el token ha expirado', async () => {
      tokenQbMock.getOne.mockResolvedValue({
        idToken: 77,
        idUsuario: 5,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
        expiraEn: new Date(Date.now() - 10000),
      });

      await expect(
        service.activarCuentaConToken(rawToken, nuevaPasswordValida),
      ).rejects.toThrow('Este enlace ha expirado.');
      expect(userRepoSaveMock).not.toHaveBeenCalled();
    });

    it('activarCuentaConToken: debe fallar si el usuario asociado no está activo', async () => {
      tokenQbMock.getOne.mockResolvedValue({
        idToken: 77,
        idUsuario: 5,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
        expiraEn: new Date(Date.now() + 3600000),
      });
      userQbMock.getOne.mockResolvedValue({
        idUsuario: 5,
        activo: false,
      });

      await expect(
        service.activarCuentaConToken(rawToken, nuevaPasswordValida),
      ).rejects.toThrow('La cuenta asociada no está disponible.');
      expect(userRepoSaveMock).not.toHaveBeenCalled();
    });

    it('activarCuentaConToken: condición de carrera (affected = 0 en UPDATE condicional) debe abortar sin guardar usuario', async () => {
      tokenQbMock.getOne.mockResolvedValue({
        idToken: 77,
        idUsuario: 5,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
        expiraEn: new Date(Date.now() + 3600000),
      });
      userQbMock.getOne.mockResolvedValue({
        idUsuario: 5,
        activo: true,
        versionCredenciales: 1,
      });
      // Simulando que otra transacción consumió el token en la ventana milimétrica
      tokenQbMock.execute.mockResolvedValue({ affected: 0 });

      await expect(
        service.activarCuentaConToken(rawToken, nuevaPasswordValida),
      ).rejects.toThrow('Este enlace ya ha sido utilizado.');
      expect(userRepoSaveMock).not.toHaveBeenCalled();
    });

    it('restablecerPasswordConToken: debe aplicar pessimistic_write, actualizar contraseña e incrementar versionCredenciales', async () => {
      const mockTokenEntity = {
        idToken: 88,
        idUsuario: 10,
        tipo: TipoTokenAccion.RECUPERACION_PASSWORD,
        usado: false,
        expiraEn: new Date(Date.now() + 3600000),
      };

      const mockUserEntity = {
        idUsuario: 10,
        nombre: 'Admin',
        activo: true,
        versionCredenciales: 3,
        passwordHash: 'hash-anterior',
      };

      tokenQbMock.getOne.mockResolvedValue(mockTokenEntity);
      userQbMock.getOne.mockResolvedValue(mockUserEntity);
      tokenQbMock.execute.mockResolvedValue({ affected: 1 });

      const res = await service.restablecerPasswordConToken(rawToken, nuevaPasswordValida);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(tokenQbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(userQbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(mockUserEntity.versionCredenciales).toBe(4);
      expect(mockUserEntity.passwordHash).toBe('');
      expect(userRepoSaveMock).toHaveBeenCalledWith(mockUserEntity);
      expect(res.success).toBe(true);
      expect(res.mensaje).toContain('Contraseña restablecida exitosamente');
    });
  });
});