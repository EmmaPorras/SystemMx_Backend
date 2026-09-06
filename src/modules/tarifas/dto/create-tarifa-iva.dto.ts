import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTarifaIvaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  descripcion!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVA', 'INACTIVA'])
  estado!: string;
}
