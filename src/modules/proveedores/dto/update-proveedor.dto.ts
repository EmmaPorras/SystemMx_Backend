import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['Proveedor', 'Local', 'Pago en especie', 'Otro'])
  tipoOrigen?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nombreReferencia?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[0-9+\s()-]+$/)
  telefono?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  correo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pais?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  direccion?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contacto?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CRC', 'USD', 'EUR', 'COP', 'BRL'])
  @MaxLength(10)
  monedaPreferida?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
