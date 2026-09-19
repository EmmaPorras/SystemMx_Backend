import { IsOptional, Matches } from 'class-validator';

export class ConsultaPeriodoDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaDesde debe tener formato YYYY-MM-DD.',
  })
  fechaDesde?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaHasta debe tener formato YYYY-MM-DD.',
  })
  fechaHasta?: string;
}
