import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { PasswordHasherService } from '../usuarios/password-hasher.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const usuariosServiceMock = {
    buscarParaAutenticacion: jest.fn(),
  };

  const passwordHasherMock = {
    verify: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsuariosService,
          useValue: usuariosServiceMock,
        },
        {
          provide: PasswordHasherService,
          useValue: passwordHasherMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login()', () => {
    it('debe autenticar con credenciales válidas, retornar access token y rol en usuario, pero NO en JWT payload', async () => {
      const usuarioEncontrado = {
        idUsuario: 1,
        username: 'admin',
        usernameNormalizado: 'admin',
        nombre: 'Administrador',
        passwordHash: '$argon2id$v=19$hashReal',
        rol: RolUsuario.ADMIN,
        activo: true,
        versionCredenciales: 1,
      };

      usuariosServiceMock.buscarParaAutenticacion.mockResolvedValue(
        usuarioEncontrado,
      );
      passwordHasherMock.verify.mockResolvedValue(true);
      configServiceMock.get.mockReturnValue('3600');
      jwtServiceMock.signAsync.mockResolvedValue('jwt.token.valido');

      const resultado = await service.login({
        username: 'admin',
        password: 'ClaveSegura123',
      });

      expect(usuariosServiceMock.buscarParaAutenticacion).toHaveBeenCalledWith(
        'admin',
      );
      expect(passwordHasherMock.verify).toHaveBeenCalledWith(
        '$argon2id$v=19$hashReal',
        'ClaveSegura123',
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 1,
          username: 'admin',
          ver: 1,
        },
        {
          expiresIn: 3600,
        },
      );
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalledWith(
        expect.objectContaining({
          rol: expect.anything() as unknown,
        }),
        expect.anything(),
      );

      expect(resultado).toEqual({
        accessToken: 'jwt.token.valido',
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuario: {
          idUsuario: 1,
          username: 'admin',
          nombre: 'Administrador',
          rol: RolUsuario.ADMIN,
          activo: true,
        },
      });

      expect(resultado).not.toHaveProperty('passwordHash');
      expect(resultado.usuario).not.toHaveProperty('passwordHash');
      expect(resultado.usuario).not.toHaveProperty('usernameNormalizado');
    });

    it('debe rechazar con 401 y mensaje genérico si el usuario no existe', async () => {
      usuariosServiceMock.buscarParaAutenticacion.mockResolvedValue(null);

      await expect(
        service.login({
          username: 'noexiste',
          password: 'ClaveSegura123',
        }),
      ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas.'));
    });

    it('debe rechazar con 401 y mensaje genérico si el usuario está inactivo', async () => {
      usuariosServiceMock.buscarParaAutenticacion.mockResolvedValue({
        idUsuario: 2,
        username: 'inactivo',
        passwordHash: '$argon2id$hash',
        activo: false,
      });

      await expect(
        service.login({
          username: 'inactivo',
          password: 'ClaveSegura123',
        }),
      ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas.'));
    });

    it('debe rechazar con 401 y mensaje genérico si la contraseña no coincide', async () => {
      usuariosServiceMock.buscarParaAutenticacion.mockResolvedValue({
        idUsuario: 1,
        username: 'admin',
        passwordHash: '$argon2id$hash',
        activo: true,
      });
      passwordHasherMock.verify.mockResolvedValue(false);

      await expect(
        service.login({
          username: 'admin',
          password: 'ClaveIncorrecta',
        }),
      ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas.'));
    });
  });
});
