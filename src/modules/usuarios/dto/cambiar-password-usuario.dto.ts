import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordPolicy } from '../validators/password-policy.validator';

export class CambiarPasswordUsuarioDto {
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @IsStrongPasswordPolicy()
  password!: string;
}
