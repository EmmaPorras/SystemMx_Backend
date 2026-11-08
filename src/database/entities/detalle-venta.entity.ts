import { resolveColumnType } from '../column-types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LoteProducto } from './lote-producto.entity';
import { Producto } from './producto.entity';
import { VentaEntity } from './venta.entity';

@Entity({ name: 'detalle_venta' })
@Index('IX_detalle_venta_id_venta', ['idVenta'])
@Index('IX_detalle_venta_id_producto', ['idProducto'])
@Index('IX_detalle_venta_id_lote', ['idLote'])
export class DetalleVenta {
  @PrimaryGeneratedColumn({ name: 'id_detalle_venta' })
  idDetalleVenta!: number;

  @Column({ name: 'id_venta', type: 'int' })
  idVenta!: number;

  @Column({ name: 'id_producto', type: 'int' })
  idProducto!: number;

  @Column({ name: 'id_lote', type: 'int' })
  idLote!: number;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad!: number;

  @Column({
    name: 'precio_unitario',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  precioUnitario!: number;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  subtotal!: number;

  @Column({
    name: 'descuento',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  descuento!: number;

  @Column({
    name: 'base_imponible',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  baseImponible!: number;

  @Column({ name: 'tipo_tarifa', type: 'varchar', length: 30 })
  tipoTarifa!: string;

  @Column({ name: 'id_tarifa_iva', type: 'int', nullable: true })
  idTarifaIva?: number | null;

  @Column({
    name: 'porcentaje_iva',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  porcentajeIva!: number;

  @Column({
    name: 'iva',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  iva!: number;

  @Column({
    name: 'total_linea',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalLinea!: number;

  @Column({
    name: 'costo_unitario_real',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoUnitarioReal!: number;

  @Column({
    name: 'costo_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoTotal!: number;

  @Column({
    name: 'ganancia_bruta',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  gananciaBruta!: number;

  @Column({ name: 'modo_descuento_lote', type: 'varchar', length: 30 })
  modoDescuentoLote!: string;

  @Column({ name: 'detalle', type: 'varchar', length: 150, nullable: true })
  detalle?: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: resolveColumnType('timestamptz', 'datetime2'),
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: resolveColumnType('timestamptz', 'datetime2'),
  })
  updatedAt!: Date;

  @ManyToOne(() => VentaEntity, (venta) => venta.detalles)
  @JoinColumn({ name: 'id_venta' })
  venta!: VentaEntity;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto!: Producto;

  @ManyToOne(() => LoteProducto)
  @JoinColumn({ name: 'id_lote' })
  lote!: LoteProducto;
}
