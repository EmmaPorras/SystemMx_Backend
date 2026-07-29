import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DetalleVenta } from './detalle-venta.entity';

@Entity({ name: 'venta' })
export class VentaEntity {
  @PrimaryGeneratedColumn({ name: 'id_venta' })
  idVenta!: number;

  @Column({ name: 'numero_venta', type: 'int', unique: true })
  numeroVenta!: number;

  @Column({ name: 'fecha_venta', type: 'date' })
  fechaVenta!: string;

  @Column({ name: 'cliente_nombre', type: 'nvarchar', length: 100, nullable: true })
  clienteNombre?: string | null;

  @Column({ name: 'medio_pago', type: 'nvarchar', length: 30 })
  medioPago!: string;

  @Column({ name: 'estado_pago', type: 'nvarchar', length: 30 })
  estadoPago!: string;

  @Column({ name: 'estado_venta', type: 'nvarchar', length: 30 })
  estadoVenta!: string;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  subtotal!: number;

  @Column({
    name: 'descuento_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  descuentoTotal!: number;

  @Column({
    name: 'iva_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  ivaTotal!: number;

  @Column({
    name: 'total_venta',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalVenta!: number;

  @Column({
    name: 'monto_pagado',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  montoPagado!: number;

  @Column({
    name: 'saldo_pendiente',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  saldoPendiente!: number;

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

  @Column({
    name: 'margen_bruto',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  margenBruto!: number;

  @Column({ name: 'fecha_entrega', type: 'date', nullable: true })
  fechaEntrega?: string | null;

  @Column({ name: 'fecha_vencimiento_pago', type: 'date', nullable: true })
  fechaVencimientoPago?: string | null;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 150, nullable: true })
  observaciones?: string | null;

  @Column({ name: 'en_papelera', type: 'bit' })
  enPapelera!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta)
  detalles!: DetalleVenta[];
}