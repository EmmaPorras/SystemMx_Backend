import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { RolUsuario } from '../rol-usuario.enum';
import { IsStrongPasswordPolicy } from '../validators/password-policy.validator';

export class CreateUsuarioDto {
  @IsString({ message: 'El username debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El username es obligatorio.' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'El username no puede exceder 50 caracteres.' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'El username solo puede contener letras, números, punto, guion y guion bajo.',
  })
  username!: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  nombre!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsStrongPasswordPolicy()
  password!: string;

  @IsEnum(RolUsuario, {
    message: 'El rol debe ser un valor válido del catálogo de roles.',
  })
  rol!: RolUsuario;
}
