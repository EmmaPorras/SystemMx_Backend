import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UsuarioPublico } from '../usuarios/usuarios.types';

type RequestConUsuario = Request & {
  user: UsuarioPublico;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioPublico => {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();

    return request.user;
  },
);
