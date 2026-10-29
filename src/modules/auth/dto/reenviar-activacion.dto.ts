import { IsEmail, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class ReenviarActivacionDto {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  email!: string;

  @IsOptional()
  @IsIn(['es', 'en', 'pt'], {
    message: 'El idioma debe ser es, en o pt.',
  })
  lang?: 'es' | 'en' | 'pt';
}
