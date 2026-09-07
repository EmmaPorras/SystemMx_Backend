import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  const usuariosServiceMock = {
    findOne: jest.fn(),
  };

  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  const crearContexto = (headers: Record<string, string | undefined>) => {
    const request = {
      headers,
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: UsuariosService,
          useValue: usuariosServiceMock,
        },
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debe permitir acceso inmediato si la ruta está marcada con @Public() sin validar JWT ni BD', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    const context = crearContexto({});

    const resultado = await guard.canActivate(context);

    expect(resultado).toBe(true);
    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      [mockHandler, mockClass],
    );
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
    expect(usuariosServiceMock.findOne).not.toHaveBeenCalled();
  });

  it('debe rechazar si no es pública y no existe header Authorization', async () => {
    const context = crearContexto({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar si el esquema no es Bearer (ej. Basic)', async () => {
    const context = crearContexto({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar si el token Bearer está vacío', async () => {
    const context = crearContexto({
      authorization: 'Bearer ',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar si jwtService.verifyAsync falla (token inválido o expirado)', async () => {
    const context = crearContexto({
      authorization: 'Bearer token.invalido.123',
    });

    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar si el payload tiene sub inválido', async () => {
    const context = crearContexto({
      authorization: 'Bearer token.valido',
    });

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: -1,
      username: 'admin',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar si el usuario no existe en base de datos', async () => {
    const context = crearContexto({
      authorization: 'Bearer token.valido',
    });

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 999,
      username: 'admin',
    });
    usuariosServiceMock.findOne.mockRejectedValue(
      new Error('Usuario no encontrado'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar si el usuario existe pero está inactivo', async () => {
    const context = crearContexto({
      authorization: 'Bearer token.valido',
    });

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 1,
      username: 'admin',
    });
    usuariosServiceMock.findOne.mockResolvedValue({
      idUsuario: 1,
      username: 'admin',
      activo: false,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe permitir acceso y asignar request.user si token es válido y usuario activo', async () => {
    const context = crearContexto({
      authorization: 'Bearer token.valido.jwt',
    });

    const usuarioPublico = {
      idUsuario: 1,
      username: 'admin',
      nombre: 'Administrador',
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 1,
      username: 'admin',
    });
    usuariosServiceMock.findOne.mockResolvedValue(usuarioPublico);

    const resultado = await guard.canActivate(context);

    expect(resultado).toBe(true);
    expect(usuariosServiceMock.findOne).toHaveBeenCalledWith(1);

    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    expect(request.user).toEqual(usuarioPublico);
  });
});
