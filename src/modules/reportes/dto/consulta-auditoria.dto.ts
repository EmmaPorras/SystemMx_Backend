import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

import { ConsultaPeriodoDto } from './consulta-periodo.dto';

export class ConsultaAuditoriaDto extends ConsultaPeriodoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'usuarioId debe ser un número entero.' })
  @Min(1, { message: 'usuarioId debe ser mayor o igual a 1.' })
  usuarioId?: number;
}
