import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'origen_compra' })
export class OrigenCompra {
  @PrimaryGeneratedColumn({ name: 'id_origen_compra' })
  idOrigenCompra!: number;

  @Column({ name: 'tipo_origen', type: 'nvarchar', length: 50 })
  tipoOrigen!: string;

  @Column({ name: 'nombre_referencia', type: 'nvarchar', length: 150 })
  nombreReferencia!: string;

  @Column({ name: 'contacto', type: 'nvarchar', length: 150, nullable: true })
  contacto?: string | null;

  @Column({
    name: 'observaciones',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
  })
  observaciones?: string | null;

  @Column({ name: 'pais', type: 'nvarchar', length: 100, nullable: true })
  pais?: string | null;

  @Column({
    name: 'moneda_preferida',
    type: 'nvarchar',
    length: 10,
    nullable: true,
  })
  monedaPreferida?: string | null;

  @Column({ name: 'telefono', type: 'nvarchar', length: 20, nullable: true })
  telefono?: string | null;

  @Column({ name: 'correo', type: 'nvarchar', length: 100, nullable: true })
  correo?: string | null;

  @Column({ name: 'direccion', type: 'nvarchar', length: 150, nullable: true })
  direccion?: string | null;

  @Column({ name: 'estado', type: 'nvarchar', length: 20, default: 'ACTIVO' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;
}