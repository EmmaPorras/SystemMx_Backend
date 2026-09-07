import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { UsuarioPublico } from '../usuarios/usuarios.types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('debe delegar el login a authService.login', async () => {
      const dto = {
        username: 'admin',
        password: 'ClaveSegura123',
      };

      const respuestaEsperada = {
        accessToken: 'jwt.token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuario: {
          idUsuario: 1,
          username: 'admin',
          nombre: 'Admin',
          activo: true,
        },
      };

      authServiceMock.login.mockResolvedValue(respuestaEsperada);

      const resultado = await controller.login(dto);

      expect(authServiceMock.login).toHaveBeenCalledWith(dto);
      expect(resultado).toEqual(respuestaEsperada);
    });
  });

  describe('me()', () => {
    it('debe retornar el usuario contenido en request.user', () => {
      const usuarioMock: UsuarioPublico = {
        idUsuario: 1,
        username: 'admin',
        nombre: 'Administrador',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const reqMock = {
        user: usuarioMock,
      } as unknown as Request & { user: UsuarioPublico };

      const resultado = controller.me(reqMock);

      expect(resultado).toEqual(usuarioMock);
    });
  });
});
