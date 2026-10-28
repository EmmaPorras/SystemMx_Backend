import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordPolicy } from '../../usuarios/validators/password-policy.validator';

export class RestablecerPasswordDto {
  @IsString({ message: 'El token debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El token es requerido.' })
  token!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @IsStrongPasswordPolicy()
  password!: string;
}
