import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCategoriaDto {
  @ValidateIf((_obj, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  @ValidateIf((_obj, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(255)
  descripcion?: string | null;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsBoolean()
  activo?: boolean;
}
