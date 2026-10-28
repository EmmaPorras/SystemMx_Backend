import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { UsuarioPublico } from '../usuarios/usuarios.types';

type RequestConUsuario = Request & {
  user: UsuarioPublico;
};

@Controller('demo')
export class DemoController {
  @Roles(RolUsuario.ADMIN, RolUsuario.DEMO)
  @Get('resumen')
  getDemoResumen(@Req() req: RequestConUsuario) {
    return {
      modo: 'DEMOSTRACION_EVALUATIVA',
      usuario: {
        idUsuario: req.user.idUsuario,
        username: req.user.username,
        nombre: req.user.nombre,
        rol: req.user.rol,
      },
      estadoAutorizacion:
        req.user.rol === RolUsuario.ADMIN
          ? 'ADMINISTRADOR_TOTAL'
          : 'ACCESO_DEMO_AISLADO_PENDIENTE_APROBACION_ADMINISTRATIVA',
      mensaje:
        'Tu cuenta se encuentra en modo Demostración Evaluativa con privilegios mínimos y datos aislados. Los datos comerciales reales de compras, ventas e inventario están protegidos. Solicita al administrador la elevación de tu rol para acceder a los módulos operativos.',
      datosAislados: {
        categoriasEjemplo: [
          { id: 1001, nombre: 'Accesorios y Cascos (Muestra)', totalProductos: 4 },
          { id: 1002, nombre: 'Repuestos de Motor (Muestra)', totalProductos: 7 },
        ],
        productosEjemplo: [
          {
            id: 2001,
            codigo: 'DEMO-CAS-001',
            nombre: 'Casco Integral Racing (Demostración)',
            precioVenta: 45000,
            stockMuestra: 12,
          },
          {
            id: 2002,
            codigo: 'DEMO-ACE-002',
            nombre: 'Aceite Sintético 4T 10W-40 (Demostración)',
            precioVenta: 8500,
            stockMuestra: 24,
          },
        ],
        metricasMuestra: {
          ventasSimuladasMes: 15,
          totalFacturadoSimulado: 650000,
          moneda: 'CRC',
        },
      },
    };
  }
}

