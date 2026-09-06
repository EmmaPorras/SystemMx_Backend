import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { LoteProducto } from './lote-producto.entity';
import { Producto } from './producto.entity';

@Entity({ name: 'movimiento_inventario' })
@Index('IX_movimiento_inventario_fecha', ['fechaMovimiento'])
@Index('IX_movimiento_inventario_producto_fecha', [
  'idProducto',
  'fechaMovimiento',
])
@Index('IX_movimiento_inventario_lote_fecha', ['idLote', 'fechaMovimiento'])
@Index('IX_movimiento_inventario_referencia', [
  'referenciaTipo',
  'referenciaId',
])
@Check('CK_movimiento_inventario_cantidad_positiva', '[cantidad] > 0')
@Check('CK_movimiento_inventario_costo_no_negativo', '[costo_unitario] >= 0')
@Check('CK_movimiento_inventario_total_no_negativo', '[total_movimiento] >= 0')
export class MovimientoInventario {
  @PrimaryGeneratedColumn({
    name: 'id_movimiento',
  })
  idMovimiento!: number;

  @Column({
    name: 'id_producto',
    type: 'int',
  })
  idProducto!: number;

  @Column({
    name: 'id_lote',
    type: 'int',
  })
  idLote!: number;

  @Column({
    name: 'fecha_movimiento',
    type: 'datetime2',
    default: () => 'GETDATE()',
  })
  fechaMovimiento!: Date;

  @Column({
    name: 'tipo_movimiento',
    type: 'nvarchar',
    length: 50,
  })
  tipoMovimiento!: string;

  @Column({
    name: 'cantidad',
    type: 'int',
  })
  cantidad!: number;

  @Column({
    name: 'observaciones',
    type: 'nvarchar',
    length: 500,
    nullable: true,
  })
  observaciones?: string | null;

  @Column({
    name: 'referencia_tipo',
    type: 'nvarchar',
    length: 30,
  })
  referenciaTipo!: string;

  @Column({
    name: 'referencia_id',
    type: 'int',
  })
  referenciaId!: number;

  @Column({
    name: 'usuario',
    type: 'nvarchar',
    length: 100,
    nullable: true,
  })
  usuario?: string | null;

  @Column({
    name: 'motivo',
    type: 'nvarchar',
    length: 255,
  })
  motivo!: string;

  @Column({
    name: 'costo_unitario',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoUnitario!: number;

  @Column({
    name: 'total_movimiento',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  totalMovimiento!: number;

  @ManyToOne(() => Producto, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'id_producto',
    referencedColumnName: 'idProducto',
  })
  producto!: Producto;

  @ManyToOne(() => LoteProducto, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'id_lote',
    referencedColumnName: 'idLote',
  })
  lote!: LoteProducto;
}
