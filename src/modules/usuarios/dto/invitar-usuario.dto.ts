import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { RolUsuario } from '../rol-usuario.enum';

export class InvitarUsuarioDto {
  @IsString({ message: 'El username debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El username no puede estar vacío.' })
  @Length(3, 50, {
    message: 'El username debe tener entre 3 y 50 caracteres.',
  })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'El username solo puede contener letras, números, guiones, puntos y guiones bajos.',
  })
  username!: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  email!: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @Length(2, 100, {
    message: 'El nombre debe tener entre 2 y 100 caracteres.',
  })
  nombre!: string;

  @IsEnum(RolUsuario, {
    message: 'El rol debe ser ADMIN, VENTAS, COMPRAS o CONSULTA.',
  })
  rol!: RolUsuario;

  @IsOptional()
  @IsIn(['es', 'en', 'pt'], {
    message: 'El idioma debe ser es, en o pt.',
  })
  lang?: 'es' | 'en' | 'pt';
}
