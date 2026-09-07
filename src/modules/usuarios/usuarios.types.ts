import { RolUsuario } from './rol-usuario.enum';

export type UsuarioPublico = {
  idUsuario: number;
  username: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
};
