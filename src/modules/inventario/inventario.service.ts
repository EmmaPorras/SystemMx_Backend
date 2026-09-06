import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import {
  RegistrarMovimientoInventarioInput,
  TipoMovimientoInventario,
} from './inventario.types';

@Injectable()
export class InventarioService {
  private obtenerReferenciaTipo(
    tipoMovimiento: TipoMovimientoInventario,
  ): 'PEDIDO' | 'VENTA' {
    switch (tipoMovimiento) {
      case 'ENTRADA_COMPRA':
        return 'PEDIDO';

      case 'SALIDA_VENTA':
      case 'REINGRESO_ANULACION_VENTA':
        return 'VENTA';
    }
  }

  private obtenerMotivoPredeterminado(
    tipoMovimiento: TipoMovimientoInventario,
  ): string {
    switch (tipoMovimiento) {
      case 'ENTRADA_COMPRA':
        return 'Recepción de mercancía por compra';

      case 'SALIDA_VENTA':
        return 'Salida de inventario por venta';

      case 'REINGRESO_ANULACION_VENTA':
        return 'Reingreso de inventario por anulación de venta';
    }
  }

  private normalizarTextoOpcional(
    value: string | null | undefined,
  ): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalizado = value.trim();

    return normalizado || null;
  }

  async registrarMovimiento(
    manager: EntityManager,
    input: RegistrarMovimientoInventarioInput,
  ): Promise<MovimientoInventario> {
    const { lote, tipoMovimiento, cantidad, referenciaId } = input;

    if (!Number.isInteger(lote.idLote) || lote.idLote <= 0) {
      throw new BadRequestException(
        'ID de lote inválido para movimiento de inventario.',
      );
    }

    if (!Number.isInteger(lote.idProducto) || lote.idProducto <= 0) {
      throw new BadRequestException(
        'ID de producto inválido para movimiento de inventario.',
      );
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new BadRequestException(
        'La cantidad del movimiento debe ser un entero positivo.',
      );
    }

    if (!Number.isInteger(referenciaId) || referenciaId <= 0) {
      throw new BadRequestException(
        'La referencia del movimiento es inválida.',
      );
    }

    const costoUnitario = Number(lote.costoUnitarioReal);

    if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
      throw new ConflictException(
        `El lote ${lote.idLote} tiene un costo unitario inválido.`,
      );
    }

    const totalMovimiento = Number((costoUnitario * cantidad).toFixed(2));

    const movimientoRepository = manager.getRepository(MovimientoInventario);

    const movimiento = movimientoRepository.create({
      idProducto: lote.idProducto,
      idLote: lote.idLote,

      tipoMovimiento,
      cantidad,

      referenciaTipo: this.obtenerReferenciaTipo(tipoMovimiento),

      referenciaId,

      usuario: this.normalizarTextoOpcional(input.usuario),

      motivo:
        this.normalizarTextoOpcional(input.motivo) ??
        this.obtenerMotivoPredeterminado(tipoMovimiento),

      observaciones: this.normalizarTextoOpcional(input.observaciones),

      costoUnitario,
      totalMovimiento,
    });

    return movimientoRepository.save(movimiento);
  }
}
