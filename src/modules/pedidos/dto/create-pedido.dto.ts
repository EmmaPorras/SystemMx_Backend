import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePedidoDetalleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  productoNombre!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^L([1-9]|10)$/)
  loteCodigo!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99999)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99999999)
  costoUnitarioOrigen!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99999999)
  precioVentaRecomendado!: number;

  @IsString()
  @IsIn(['EN_PROCESO', 'EN_STOCK', 'VENDIDO_PARCIAL', 'AGOTADO'])
  estadoLote!: string;
}

export class CreatePedidoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  numeroPedido!: number;

  @IsString()
  @IsNotEmpty()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  origen!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  proveedorId!: number;

  @IsString()
  @IsIn(['CRC', 'USD', 'EUR', 'COP', 'BRL'])
  monedaCompra!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.99)
  tipoCambio!: number;

  @IsString()
  @IsIn(['REGISTRADO', 'EN_TRANSITO', 'RECIBIDO', 'CANCELADO'])
  estado!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoDetalleDto)
  detalles!: CreatePedidoDetalleDto[];
}