import { LoteProducto } from '../../database/entities/lote-producto.entity';

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

  observaciones?: string | null;

  /**
   * Hasta que exista Seguridad/Usuarios,
   * puede mantenerse null.
   */
  usuario?: string | null;

  /**
   * Si no viene, InventarioService utiliza
   * un motivo estándar según el movimiento.
   */
  motivo?: string | null;
};
