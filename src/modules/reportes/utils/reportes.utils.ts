import { BadRequestException } from '@nestjs/common';

import { ConsultaPeriodoDto } from '../dto/consulta-periodo.dto';

export function redondear(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatearFecha(fecha: unknown): string {
  if (typeof fecha === 'string') {
    return fecha.slice(0, 10);
  }
  if (fecha instanceof Date) {
    return fecha.toISOString().slice(0, 10);
  }
  return String(fecha).slice(0, 10);
}

export function siguienteFechaIso(fecha: string): string {
  const value = new Date(`${fecha}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export function calcularPorcentaje(parte: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return redondear((parte / total) * 100);
}

export function validarFechaIso(value: string, campo: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${campo} debe tener formato YYYY-MM-DD.`);
  }

  const fecha = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`${campo} no es una fecha válida.`);
  }
}

export function validarPeriodo(dto: ConsultaPeriodoDto): void {
  if (dto.fechaDesde) {
    validarFechaIso(dto.fechaDesde, 'fechaDesde');
  }

  if (dto.fechaHasta) {
    validarFechaIso(dto.fechaHasta, 'fechaHasta');
  }

  if (dto.fechaDesde && dto.fechaHasta && dto.fechaDesde > dto.fechaHasta) {
    throw new BadRequestException(
      'fechaDesde no puede ser posterior a fechaHasta.',
    );
  }
}
