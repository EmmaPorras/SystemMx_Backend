import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Proveedor', 'Local', 'Pago en especie', 'Otro'])
  tipoOrigen!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nombreReferencia!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[0-9+\s()-]+$/)
  telefono!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  correo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pais!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado!: string;

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
