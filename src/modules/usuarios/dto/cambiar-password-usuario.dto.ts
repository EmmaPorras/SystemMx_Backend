import { IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordUsuarioDto {
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
