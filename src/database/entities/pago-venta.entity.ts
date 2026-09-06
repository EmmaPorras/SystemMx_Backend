import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { VentaEntity } from './venta.entity';

@Entity({ name: 'pago_venta' })
@Index('IX_pago_venta_id_venta_created', ['idVenta', 'createdAt'])
@Check('CK_pago_venta_monto_positivo', '[monto] > 0')
export class PagoVenta {
  @PrimaryGeneratedColumn({
    name: 'id_pago_venta',
  })
  idPagoVenta!: number;

  @Column({
    name: 'id_venta',
    type: 'int',
  })
  idVenta!: number;

  @Column({
    name: 'metodo_pago',
    type: 'nvarchar',
    length: 50,
  })
  metodoPago!: string;

  @Column({
    name: 'monto',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  monto!: number;

  @Column({
    name: 'referencia',
    type: 'nvarchar',
    length: 150,
    nullable: true,
  })
  referencia?: string | null;

  @Column({
    name: 'observaciones',
    type: 'nvarchar',
    nullable: true,
  })
  observaciones?: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime2',
    default: () => 'GETDATE()',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime2',
    default: () => 'GETDATE()',
  })
  updatedAt!: Date;

  @ManyToOne(() => VentaEntity, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'id_venta',
    referencedColumnName: 'idVenta',
  })
  venta!: VentaEntity;
}
