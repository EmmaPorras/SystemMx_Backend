import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { UsuarioPublico } from '../usuarios/usuarios.types';
import { ROLES_KEY } from './roles.decorator';

type RequestConUsuario = Request & {
  user?: UsuarioPublico;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestConUsuario>();

    const usuario = request.user;

    if (!usuario) {
      throw new UnauthorizedException('No autenticado.');
    }

    if (!rolesRequeridos.includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta acción.',
      );
    }

    return true;
  }
}
