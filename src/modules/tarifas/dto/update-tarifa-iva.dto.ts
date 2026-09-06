import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTarifaIvaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVA', 'INACTIVA'])
  estado?: string;
}
