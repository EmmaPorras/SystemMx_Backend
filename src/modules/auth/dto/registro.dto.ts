import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPasswordPolicy } from '../../usuarios/validators/password-policy.validator';

export class RegistroDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  nombre!: string;

  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de usuario es requerido.' })
  @MinLength(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres.',
  })
  @MaxLength(50, {
    message: 'El nombre de usuario no puede exceder 50 caracteres.',
  })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números, punto, guion y guion bajo.',
  })
  username!: string;

  @IsString({ message: 'El correo electrónico debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  @IsEmail(
    {},
    { message: 'Debe proporcionar un correo electrónico válido.' },
  )
  @MaxLength(255, {
    message: 'El correo electrónico no puede exceder 255 caracteres.',
  })
  email!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  @IsStrongPasswordPolicy()
  password!: string;

  @IsOptional()
  @IsString({ message: 'El idioma debe ser una cadena de texto.' })
  @IsIn(['es', 'en', 'pt'], {
    message: 'El idioma seleccionado debe ser es, en o pt.',
  })
  lang?: 'es' | 'en' | 'pt';
}

