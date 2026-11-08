import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { ReportesController } from './reportes.controller';

describe('Permisos efectivos de reportes y cuentas por cobrar (Etapa 12)', () => {
  const reflector = new Reflector();

  function rolesOf(method: keyof ReportesController): RolUsuario[] | undefined {
    return reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      ReportesController.prototype[method],
      ReportesController,
    ]);
  }

  it('permite a VENTAS ver cuentas por cobrar', () => {
    expect(rolesOf('cuentasPorCobrar')).toEqual([
      RolUsuario.ADMIN,
      RolUsuario.VENTAS,
    ]);
    expect(rolesOf('vencimientosCuentasPorCobrar')).toEqual([
      RolUsuario.ADMIN,
      RolUsuario.VENTAS,
    ]);
  });

  it('no concede acceso de VENTAS a los reportes globales', () => {
    expect(rolesOf('resumen')).toEqual([RolUsuario.ADMIN, RolUsuario.CONSULTA]);
    expect(rolesOf('resumenVentas')).toEqual([
      RolUsuario.ADMIN,
      RolUsuario.CONSULTA,
    ]);
  });
});
