import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecepcionPedidoDetalleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idLote!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidadRecibida!: number;
}

export class RecepcionPedidoDto {
  @IsDateString()
  fechaRecepcion!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecepcionPedidoDetalleDto)
  detalles!: RecepcionPedidoDetalleDto[];
}
