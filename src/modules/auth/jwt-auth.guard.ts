import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { UsuarioPublico } from '../usuarios/usuarios.types';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtPayload } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';

type AuthenticatedRequest = Request & {
  user?: UsuarioPublico;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    private readonly usuariosService: UsuariosService,

    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extraerBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('No autenticado.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (
        !Number.isInteger(payload.sub) ||
        payload.sub <= 0 ||
        typeof payload.username !== 'string' ||
        !Number.isInteger(payload.ver) ||
        payload.ver <= 0
      ) {
        throw new Error('Payload inválido');
      }

      const sesion = await this.usuariosService.buscarParaSesion(payload.sub);

      if (!sesion || !sesion.usuario.activo) {
        throw new Error('Usuario inválido');
      }

      if (payload.ver !== sesion.versionCredenciales) {
        throw new Error('Token revocado');
      }

      request.user = sesion.usuario;

      return true;
    } catch {
      throw new UnauthorizedException('No autenticado.');
    }
  }

  private extraerBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [tipo, token] = authorization.split(' ');

    if (tipo?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
