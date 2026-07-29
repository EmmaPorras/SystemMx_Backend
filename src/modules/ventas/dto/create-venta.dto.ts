import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateVentaDetalleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loteId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99999)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(99999999)
  precioUnitario!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99999999)
  descuento?: number;

  @IsString()
  @IsIn(['IVA', 'EXENTO', 'ESPECIAL'])
  tipoTarifa!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTarifaIva?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeIva?: number;

  @IsOptional()
  @IsString()
  @IsIn(['FIFO', 'MANUAL'])
  modoDescuentoLote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  detalle?: string;
}

export class CreateVentaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999999)
  numeroVenta!: number;

  @IsDateString()
  fechaVenta!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clienteNombre?: string;

  @IsString()
  @IsIn(['EFECTIVO', 'SINPE', 'TRANSFERENCIA', 'TARJETA', 'MIXTO', 'OTRO'])
  medioPago!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99999999)
  montoPagado?: number;

  @IsOptional()
  @IsDateString()
  fechaEntrega?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimientoPago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  enPapelera?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateVentaDetalleDto)
  detalles!: CreateVentaDetalleDto[];
}