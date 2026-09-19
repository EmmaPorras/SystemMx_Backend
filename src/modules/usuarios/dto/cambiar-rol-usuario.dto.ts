import { IsEnum } from 'class-validator';

import { RolUsuario } from '../rol-usuario.enum';

export class CambiarRolUsuarioDto {
  @IsEnum(RolUsuario)
  rol!: RolUsuario;
}
