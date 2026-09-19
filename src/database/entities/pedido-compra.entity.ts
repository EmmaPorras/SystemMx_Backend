import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DetallePedidoCompra } from './detalle-pedido-compra.entity';
import { LoteProducto } from './lote-producto.entity';
import { OrigenCompra } from './origen-compra.entity';

@Entity({ name: 'pedido_compra' })
@Index('UX_pedido_compra_numero_pedido', ['numeroPedido'], {
  unique: true,
})
export class PedidoCompraEntity {
  @PrimaryGeneratedColumn({ name: 'id_pedido' })
  idPedido!: number;

  @Column({ name: 'numero_pedido', type: 'int' })
  numeroPedido!: number;

  @Column({ name: 'nombre_pedido', type: 'nvarchar', length: 150 })
  nombrePedido!: string;

  @Column({ name: 'id_origen_compra', type: 'int' })
  idOrigenCompra!: number;

  @Column({ name: 'fecha_pedido', type: 'date' })
  fechaPedido!: string;

  @Column({ name: 'fecha_recepcion', type: 'date', nullable: true })
  fechaRecepcion?: string | null;

  @Column({ name: 'estado', type: 'nvarchar', length: 30 })
  estado!: string;

  @Column({
    name: 'inversion_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  inversionTotal!: number;

  @Column({
    name: 'costo_envio',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  costoEnvio!: number;

  @Column({
    name: 'impuestos_importacion',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  impuestosImportacion!: number;

  @Column({ name: 'observaciones', type: 'nvarchar', nullable: true })
  observaciones?: string | null;

  @Column({
    name: 'pais_compra',
    type: 'nvarchar',
    length: 100,
    nullable: true,
  })
  paisCompra?: string | null;

  @Column({ name: 'moneda_compra', type: 'nvarchar', length: 10 })
  monedaCompra!: string;

  @Column({
    name: 'tipo_cambio',
    type: 'decimal',
    precision: 12,
    scale: 4,
  })
  tipoCambio!: number;

  @Column({
    name: 'subtotal_productos',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  subtotalProductos!: number;

  @Column({
    name: 'envio_interno',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  envioInterno!: number;

  @Column({
    name: 'envio_casillero',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  envioCasillero!: number;

  @Column({
    name: 'otros_gastos',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  otrosGastos!: number;

  @Column({ name: 'metodo_reparto_gastos', type: 'nvarchar', length: 30 })
  metodoRepartoGastos!: string;

  @Column({
    name: 'dias_duracion',
    type: 'int',
    nullable: true,
    insert: false,
    update: false,
  })
  diasDuracion?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @ManyToOne(() => OrigenCompra)
  @JoinColumn({ name: 'id_origen_compra' })
  origenCompra!: OrigenCompra;

  @OneToMany(() => DetallePedidoCompra, (detalle) => detalle.pedido)
  detalles!: DetallePedidoCompra[];

  @OneToMany(() => LoteProducto, (lote) => lote.pedido)
  lotes!: LoteProducto[];
}
