import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PedidoCompraEntity } from './pedido-compra.entity';
import { Producto } from './producto.entity';

@Entity({ name: 'detalle_pedido_compra' })
export class DetallePedidoCompra {
  @PrimaryGeneratedColumn({ name: 'id_detalle_pedido' })
  idDetallePedido!: number;

  @Column({ name: 'id_pedido', type: 'int' })
  idPedido!: number;

  @Column({ name: 'id_producto', type: 'int' })
  idProducto!: number;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad!: number;

  @Column({ name: 'moneda_origen', type: 'nvarchar', length: 10 })
  monedaOrigen!: string;

  @Column({
    name: 'costo_unitario_origen',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoUnitarioOrigen!: number;

  @Column({
    name: 'total_origen',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalOrigen!: number;

  @Column({
    name: 'tipo_cambio',
    type: 'decimal',
    precision: 12,
    scale: 4,
  })
  tipoCambio!: number;

  @Column({
    name: 'total_colones',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalColones!: number;

  @Column({
    name: 'envio_asignado',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  envioAsignado!: number;

  @Column({
    name: 'impuestos_asignados',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  impuestosAsignados!: number;

  @Column({
    name: 'otros_gastos_asignados',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  otrosGastosAsignados!: number;

  @Column({
    name: 'costo_total_real',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoTotalReal!: number;

  @Column({
    name: 'costo_unitario_real',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoUnitarioReal!: number;

  @Column({
    name: 'precio_venta_sugerido',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precioVentaSugerido?: number | null;

  @Column({
    name: 'precio_venta_final',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precioVentaFinal?: number | null;

  @Column({ name: 'metodo_reparto_gastos', type: 'nvarchar', length: 30 })
  metodoRepartoGastos!: string;

  @Column({ name: 'observaciones', type: 'nvarchar', nullable: true })
  observaciones?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @ManyToOne(() => PedidoCompraEntity, (pedido) => pedido.detalles)
  @JoinColumn({ name: 'id_pedido' })
  pedido!: PedidoCompraEntity;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto!: Producto;
}
