import { IsIn, IsOptional } from 'class-validator';

import { TIPOS_MOVIMIENTO_INVENTARIO } from '../../inventario/inventario.types';
import { ConsultaAuditoriaDto } from './consulta-auditoria.dto';

export class ConsultaAuditoriaMovimientosDto extends ConsultaAuditoriaDto {
  @IsOptional()
  @IsIn(TIPOS_MOVIMIENTO_INVENTARIO, {
    message:
      'tipoMovimiento debe ser ENTRADA_COMPRA, SALIDA_VENTA o REINGRESO_ANULACION_VENTA.',
  })
  tipoMovimiento?: string;
}
