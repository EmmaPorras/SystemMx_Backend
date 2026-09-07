import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { ActorAuditoria } from '../auth/auth.types';

export const TIPOS_MOVIMIENTO_INVENTARIO = [
  'ENTRADA_COMPRA',
  'SALIDA_VENTA',
  'REINGRESO_ANULACION_VENTA',
] as const;

export type TipoMovimientoInventario =
  (typeof TIPOS_MOVIMIENTO_INVENTARIO)[number];

export type ReferenciaMovimientoInventario = 'PEDIDO' | 'VENTA';

export type RegistrarMovimientoInventarioInput = {
  lote: LoteProducto;

  tipoMovimiento: TipoMovimientoInventario;

  cantidad: number;

  /**
   * ENTRADA_COMPRA:
   * idPedido.
   *
   * SALIDA_VENTA / REINGRESO:
   * idVenta.
   */
  referenciaId: number;

  actor: ActorAuditoria;

  observaciones?: string | null;

  /**
   * Si no viene, InventarioService utiliza
   * un motivo estándar según el movimiento.
   */
  motivo?: string | null;
};
