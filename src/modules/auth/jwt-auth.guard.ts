import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtPayload } from './auth.types';

type AuthenticatedRequest = Request & {
  user?: Awaited<ReturnType<UsuariosService['findOne']>>;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    private readonly usuariosService: UsuariosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
        typeof payload.username !== 'string'
      ) {
        throw new Error('Payload inválido');
      }

      const usuario = await this.usuariosService.findOne(payload.sub);

      if (!usuario.activo) {
        throw new Error('Usuario inactivo');
      }

      request.user = usuario;

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
