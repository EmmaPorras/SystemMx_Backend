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

import { DetallePedidoCompra } from './detalle-pedido-compra.entity';
import { PedidoCompraEntity } from './pedido-compra.entity';
import { Producto } from './producto.entity';

@Entity({ name: 'lote_producto' })
@Index('IX_lote_producto_id_producto', ['idProducto'])
export class LoteProducto {
  @PrimaryGeneratedColumn({ name: 'id_lote' })
  idLote!: number;

  @Column({ name: 'id_pedido', type: 'int' })
  idPedido!: number;

  @Column({ name: 'id_producto', type: 'int' })
  idProducto!: number;

  @Column({ name: 'id_detalle_pedido', type: 'int', nullable: true })
  idDetallePedido?: number | null;

  @Column({ name: 'codigo_lote', type: 'varchar', length: 10 })
  codigoLote!: string;

  @Column({ name: 'cantidad_inicial', type: 'int' })
  cantidadInicial!: number;

  @Column({ name: 'cantidad_recibida', type: 'int' })
  cantidadRecibida!: number;

  @Column({ name: 'cantidad_disponible', type: 'int' })
  cantidadDisponible!: number;

  @Column({
    name: 'costo_unitario_real',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoUnitarioReal!: number;

  @Column({
    name: 'precio_venta_recomendado',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  precioVentaRecomendado!: number;

  @Column({ name: 'estado_lote', type: 'varchar', length: 30 })
  estadoLote!: string;

  @Column({ name: 'fecha_entrada', type: 'date', nullable: true })
  fechaEntrada?: string | null;

  @Column({
    name: 'precio_venta_final',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precioVentaFinal?: number | null;

  @Column({ name: 'tipo_lote', type: 'varchar', length: 30 })
  tipoLote!: string;

  @Column({
    name: 'costo_pendiente_al_vender',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoPendienteAlVender!: number;

  @Column({ name: 'observaciones', type: 'varchar', nullable: true })
  observaciones?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => PedidoCompraEntity, (pedido) => pedido.lotes)
  @JoinColumn({ name: 'id_pedido' })
  pedido!: PedidoCompraEntity;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto!: Producto;

  @ManyToOne(() => DetallePedidoCompra, { nullable: true })
  @JoinColumn({ name: 'id_detalle_pedido' })
  detallePedido?: DetallePedidoCompra | null;
}
