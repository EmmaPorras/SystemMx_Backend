import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ActivarCuentaDto {
  @IsString({ message: 'El token debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El token es requerido.' })
  token!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @Length(12, 128, {
    message: 'La contraseña debe tener entre 12 y 128 caracteres.',
  })
  password!: string;
}
