import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { UsuarioPublico } from '../usuarios/usuarios.types';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  const crearContexto = (user?: UsuarioPublico) => {
    const request = {
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    } as unknown as ExecutionContext;
  };

  const mockUsuario = (rol: RolUsuario): UsuarioPublico => ({
    idUsuario: 1,
    username: 'testuser',
    nombre: 'Test User',
    rol,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debe consultar la metadata de roles con el Reflector usando ROLES_KEY', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const context = crearContexto(mockUsuario(RolUsuario.ADMIN));

    guard.canActivate(context);

    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockHandler,
      mockClass,
    ]);
  });

  it('debe permitir el acceso si no hay metadata de roles requeridos', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const context = crearContexto(mockUsuario(RolUsuario.CONSULTA));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir el acceso si el arreglo de roles requeridos está vacío', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([]);
    const context = crearContexto(mockUsuario(RolUsuario.CONSULTA));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar UnauthorizedException (401) si hay roles requeridos pero request.user está ausente', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN]);
    const context = crearContexto(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('debe permitir el acceso si el rol del usuario coincide exactamente (ADMIN requerido + ADMIN)', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN]);
    const context = crearContexto(mockUsuario(RolUsuario.ADMIN));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException (403) si ADMIN es requerido pero el usuario es OPERADOR', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN]);
    const context = crearContexto(mockUsuario(RolUsuario.OPERADOR));

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe permitir el acceso si ADMIN/OPERADOR son requeridos y el usuario es OPERADOR', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      RolUsuario.ADMIN,
      RolUsuario.OPERADOR,
    ]);
    const context = crearContexto(mockUsuario(RolUsuario.OPERADOR));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException (403) si ADMIN/OPERADOR son requeridos y el usuario es CONSULTA', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      RolUsuario.ADMIN,
      RolUsuario.OPERADOR,
    ]);
    const context = crearContexto(mockUsuario(RolUsuario.CONSULTA));

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
