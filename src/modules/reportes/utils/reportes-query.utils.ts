import { SelectQueryBuilder } from 'typeorm';

import { ConsultaPeriodoDto } from '../dto/consulta-periodo.dto';
import { siguienteFechaIso } from './reportes.utils';

export function aplicarPeriodo<T extends object>(
  query: SelectQueryBuilder<T>,
  aliasFecha: string,
  dto: ConsultaPeriodoDto,
): void {
  if (dto.fechaDesde) {
    query.andWhere(`${aliasFecha} >= :fechaDesde`, {
      fechaDesde: dto.fechaDesde,
    });
  }

  if (dto.fechaHasta) {
    query.andWhere(`${aliasFecha} <= :fechaHasta`, {
      fechaHasta: dto.fechaHasta,
    });
  }
}

export function aplicarPeriodoDatetime<T extends object>(
  query: SelectQueryBuilder<T>,
  campo: string,
  dto: ConsultaPeriodoDto,
): void {
  if (dto.fechaDesde) {
    query.andWhere(`${campo} >= :fechaDesdeDatetime`, {
      fechaDesdeDatetime: `${dto.fechaDesde}T00:00:00.000`,
    });
  }

  if (dto.fechaHasta) {
    const fechaHastaExclusiva = siguienteFechaIso(dto.fechaHasta);

    query.andWhere(`${campo} < :fechaHastaExclusiva`, {
      fechaHastaExclusiva: `${fechaHastaExclusiva}T00:00:00.000`,
    });
  }
}
