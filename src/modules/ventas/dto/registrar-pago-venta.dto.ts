import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RegistrarPagoVentaDto {
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
    allowInfinity: false,
    allowNaN: false,
  })
  @Min(0.01)
  monto!: number;

  @IsString()
  @IsIn(['EFECTIVO', 'SINPE', 'TRANSFERENCIA', 'TARJETA', 'MIXTO', 'OTRO'])
  metodoPago!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
