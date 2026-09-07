import { UsuarioPublico } from '../usuarios/usuarios.types';

export type JwtPayload = {
  sub: number;
  username: string;
};

export type RequestAutenticado = {
  user: UsuarioPublico;
};

export type ActorAuditoria = {
  idUsuario: number;
  username: string;
};
