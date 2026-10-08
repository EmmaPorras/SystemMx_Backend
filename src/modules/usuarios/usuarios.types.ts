import { RolUsuario } from './rol-usuario.enum';
import { EstadoActivacionUsuario } from './estado-activacion.enum';

export type UsuarioPublico = {
  idUsuario: number;
  username: string;
  email?: string | null;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  estadoActivacion?: EstadoActivacionUsuario;
  createdAt: Date;
  updatedAt: Date;
};
