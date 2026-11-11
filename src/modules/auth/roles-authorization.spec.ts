import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { UsuarioPublico } from '../usuarios/usuarios.types';
import { ROLES_KEY } from './roles.decorator';

describe('SYSTEMMX - Matriz de Autorización por Módulo y Rol (Etapa 12)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockExecutionContext(
    user?: Partial<UsuarioPublico>,
  ): ExecutionContext {
    const request = {
      user: user
        ? ({
            idUsuario: 1,
            username: 'test',
            nombre: 'Test',
            activo: true,
            ...user,
          } as UsuarioPublico)
        : undefined,
    };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  function setupRequiredRoles(roles?: RolUsuario[]) {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  }

  describe('Autenticación base (401)', () => {
    it('debe rechazar con 401 si no hay usuario autenticado en una ruta protegida con roles', () => {
      setupRequiredRoles([RolUsuario.ADMIN]);
      const context = mockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('debe permitir acceso si la ruta no tiene roles asignados', () => {
      setupRequiredRoles(undefined);
      const context = mockExecutionContext(undefined);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Módulo Usuarios (Solo ADMIN)', () => {
    const rolesPermitidos = [RolUsuario.ADMIN];

    it('ADMIN puede administrar usuarios', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('VENTAS no puede administrar usuarios (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.VENTAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('COMPRAS no puede administrar usuarios (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.COMPRAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('CONSULTA no puede administrar usuarios (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.CONSULTA });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('Módulo Ventas y Cuentas por Cobrar (ADMIN y VENTAS)', () => {
    const rolesPermitidos = [RolUsuario.ADMIN, RolUsuario.VENTAS];

    it('ADMIN puede registrar ventas y pagos', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('VENTAS puede registrar ventas y pagos', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.VENTAS });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('COMPRAS no puede registrar ventas ni pagos (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.COMPRAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('CONSULTA no puede registrar ventas ni pagos (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.CONSULTA });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('Módulo Pedidos y Recepción de Mercancía (ADMIN y COMPRAS)', () => {
    const rolesPermitidos = [RolUsuario.ADMIN, RolUsuario.COMPRAS];

    it('ADMIN puede crear pedidos y recibir mercancía', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('COMPRAS puede crear pedidos y recibir mercancía', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.COMPRAS });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('VENTAS no puede crear pedidos ni recibir mercancía (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.VENTAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('CONSULTA no puede crear pedidos ni recibir mercancía (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.CONSULTA });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('Módulo Inventario (Lectura: ADMIN, VENTAS, COMPRAS, CONSULTA)', () => {
    const rolesPermitidos = [
      RolUsuario.ADMIN,
      RolUsuario.VENTAS,
      RolUsuario.COMPRAS,
      RolUsuario.CONSULTA,
    ];

    it('ADMIN puede consultar inventario', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('VENTAS puede consultar inventario', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.VENTAS });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('COMPRAS puede consultar inventario', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.COMPRAS });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('CONSULTA puede consultar inventario', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.CONSULTA });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Módulo Reportes Globales (ADMIN y CONSULTA)', () => {
    const rolesPermitidos = [RolUsuario.ADMIN, RolUsuario.CONSULTA];

    it('ADMIN puede consultar reportes globales', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('CONSULTA puede consultar reportes globales', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.CONSULTA });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('VENTAS no puede acceder a reportes globales (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.VENTAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('COMPRAS no puede acceder a reportes globales (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.COMPRAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('Módulo Auditoría (Solo ADMIN)', () => {
    const rolesPermitidos = [RolUsuario.ADMIN];

    it('ADMIN puede consultar auditoría', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('VENTAS no puede consultar auditoría (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.VENTAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('COMPRAS no puede consultar auditoría (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.COMPRAS });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('CONSULTA no puede consultar auditoría (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.CONSULTA });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede consultar auditoría (403)', () => {
      setupRequiredRoles(rolesPermitidos);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('Aislamiento de Privilegios de Rol DEMO (Fase 4)', () => {
    it('DEMO no puede acceder a ventas ni pagos (403)', () => {
      setupRequiredRoles([RolUsuario.ADMIN, RolUsuario.VENTAS]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede crear pedidos ni recibir mercancía (403)', () => {
      setupRequiredRoles([RolUsuario.ADMIN, RolUsuario.COMPRAS]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede consultar reportes financieros globales (403)', () => {
      setupRequiredRoles([RolUsuario.ADMIN, RolUsuario.CONSULTA]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO tiene acceso autorizado al módulo de evaluación demostrativa', () => {
      setupRequiredRoles([RolUsuario.ADMIN, RolUsuario.DEMO]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(guard.canActivate(ctx)).toBe(true);
    });
    it('DEMO no puede consultar inventario ni lotes (403)', () => {
      setupRequiredRoles([
        RolUsuario.ADMIN,
        RolUsuario.VENTAS,
        RolUsuario.COMPRAS,
        RolUsuario.CONSULTA,
      ]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede consultar ni gestionar proveedores (403)', () => {
      setupRequiredRoles([
        RolUsuario.ADMIN,
        RolUsuario.COMPRAS,
        RolUsuario.CONSULTA,
      ]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede consultar ni configurar tarifas IVA (403)', () => {
      setupRequiredRoles([
        RolUsuario.ADMIN,
        RolUsuario.VENTAS,
        RolUsuario.COMPRAS,
        RolUsuario.CONSULTA,
      ]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede consultar catálogo comercial de productos (403)', () => {
      setupRequiredRoles([
        RolUsuario.ADMIN,
        RolUsuario.VENTAS,
        RolUsuario.COMPRAS,
        RolUsuario.CONSULTA,
      ]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('DEMO no puede administrar usuarios del sistema (403)', () => {
      setupRequiredRoles([RolUsuario.ADMIN]);
      const ctx = mockExecutionContext({ rol: RolUsuario.DEMO });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
