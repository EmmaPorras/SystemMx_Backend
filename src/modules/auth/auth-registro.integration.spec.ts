import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PasswordHasherService } from '../usuarios/password-hasher.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { EstadoActivacionUsuario } from '../usuarios/estado-activacion.enum';
import { TipoTokenAccion } from '../usuarios/tipo-token-accion.enum';
import { RegistroDto } from './dto/registro.dto';

describe('AuthService - Registro Público, Activación y Política de Contraseñas (Fases 3 y 4)', () => {
  let authService: AuthService;
  let usuariosService: jest.Mocked<Partial<UsuariosService>>;
  let passwordHasher: jest.Mocked<Partial<PasswordHasherService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    usuariosService = {
      buscarParaAutenticacion: jest.fn(),
      registrarPublico: jest.fn(),
      validarTokenAccion: jest.fn(),
      activarCuentaConToken: jest.fn(),
      restablecerPasswordConToken: jest.fn(),
    };

    passwordHasher = {
      hash: jest
        .fn()
        .mockImplementation((pwd: string) =>
          Promise.resolve(`argon2id$mock$${pwd}`),
        ),
      verify: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token-xyz'),
    };

    configService = {
      get: jest.fn().mockReturnValue('3600'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: usuariosService },
        { provide: PasswordHasherService, useValue: passwordHasher },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('Registro Público Seguro (Fase 4)', () => {
    it('debe registrar un usuario público asignando estrictamente el rol DEMO y estado PENDIENTE_ACTIVACION', async () => {
      const dto: RegistroDto = {
        nombre: 'Usuario Evaluador',
        username: 'evaluador.publico',
        email: 'evaluador@gmail.com',
        password: 'MiContraseñaSeguraSystemMx2026!',
      };

      (usuariosService.registrarPublico as jest.Mock).mockResolvedValue({
        message:
          'Registro exitoso. Se ha enviado un enlace de activación a tu correo electrónico.',
        usuario: {
          idUsuario: 50,
          username: 'evaluador.publico',
          nombre: 'Usuario Evaluador',
          email: 'evaluador@gmail.com',
          rol: RolUsuario.DEMO,
          activo: true,
        },
      });

      const response = await authService.registrarPublico(dto, '127.0.0.1');

      expect(usuariosService.registrarPublico).toHaveBeenCalledWith(
        dto,
        '127.0.0.1',
      );
      expect(response.usuario.rol).toBe(RolUsuario.DEMO);
      expect(response.message).toContain('enlace de activación');
    });

    it('debe propagar ConflictException si el username o email ya existen', async () => {
      const dto: RegistroDto = {
        nombre: 'Duplicado Test',
        username: 'admin',
        email: 'admin@systemmx.com',
        password: 'MiContraseñaSeguraSystemMx2026!',
      };

      (usuariosService.registrarPublico as jest.Mock).mockRejectedValue(
        new ConflictException('El nombre de usuario ya está registrado.'),
      );

      await expect(authService.registrarPublico(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('Login Retrocompatible para Cuentas Existentes (Fase 3: AC-07)', () => {
    it('debe permitir iniciar sesión a un usuario existente con contraseña histórica de 8 caracteres sin rechazo retroactivo', async () => {
      const usuarioHistorico = {
        idUsuario: 3,
        username: 'operador.antiguo',
        nombre: 'Operador Antiguo',
        passwordHash: 'argon2id$mock$clave8ch',
        rol: RolUsuario.CONSULTA,
        activo: true,
        estadoActivacion: EstadoActivacionUsuario.ACTIVO,
        versionCredenciales: 1,
      };

      (usuariosService.buscarParaAutenticacion as jest.Mock).mockResolvedValue(
        usuarioHistorico,
      );
      (passwordHasher.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        username: 'operador.antiguo',
        password: 'clave8ch', // 8 caracteres (clave anterior)
      });

      expect(result.accessToken).toBe('mock-jwt-token-xyz');
      expect(result.usuario.username).toBe('operador.antiguo');
      expect(result.usuario.rol).toBe(RolUsuario.CONSULTA);
    });

    it('debe bloquear login si la cuenta está en estado PENDIENTE_ACTIVACION', async () => {
      const usuarioPendiente = {
        idUsuario: 50,
        username: 'evaluador.nuevo',
        nombre: 'Evaluador Nuevo',
        passwordHash: 'argon2id$mock$clave',
        rol: RolUsuario.DEMO,
        activo: true,
        estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
        versionCredenciales: 1,
      };

      (usuariosService.buscarParaAutenticacion as jest.Mock).mockResolvedValue(
        usuarioPendiente,
      );

      await expect(
        authService.login({
          username: 'evaluador.nuevo',
          password: 'MiContraseñaSeguraSystemMx2026!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Activación de Cuenta mediante Token Seguro', () => {
    it('debe activar la cuenta cuando se envía el token y la nueva contraseña válida', async () => {
      (usuariosService.activarCuentaConToken as jest.Mock).mockResolvedValue({
        success: true,
        mensaje: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.',
      });

      const res = await authService.activarCuenta({
        token: 'token-valido-1234567890abcdef',
        password: 'NuevaContraseñaSegura15!',
      });

      expect(res.success).toBe(true);
      expect(usuariosService.activarCuentaConToken).toHaveBeenCalledWith(
        'token-valido-1234567890abcdef',
        'NuevaContraseñaSegura15!',
      );
    });
  });
});
