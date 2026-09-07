import { IsDefined, Matches } from 'class-validator';

export class ConsultaVencimientosDto {
  @IsDefined({ message: 'fechaCorte es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaCorte debe tener formato YYYY-MM-DD.',
  })
  fechaCorte!: string;
}
