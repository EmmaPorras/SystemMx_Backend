import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Categoria } from './categoria.entity';
import { TarifaIva } from './tarifa-iva.entity';

@Entity({ name: 'producto' })
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  idProducto!: number;

  @Column({ name: 'id_categoria', type: 'int', nullable: true })
  idCategoria?: number | null;

  @Column({ name: 'id_tarifa_iva', type: 'int', nullable: true })
  idTarifaIva?: number | null;

  @Column({ name: 'nombre', type: 'nvarchar', length: 150 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'nvarchar', nullable: true })
  descripcion?: string | null;

  @Column({ name: 'sku', type: 'nvarchar', length: 100, nullable: true })
  sku?: string | null;

  @Column({
    name: 'precio_venta_sugerido_sin_iva',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  precioVentaSugeridoSinIva!: number;

  @Column({ name: 'stock_minimo', type: 'int' })
  stockMinimo!: number;

  @Column({ name: 'activo', type: 'bit' })
  activo!: boolean;

  @Column({ name: 'marca', type: 'nvarchar', length: 100, nullable: true })
  marca?: string | null;

  @Column({ name: 'variante', type: 'nvarchar', length: 100, nullable: true })
  variante?: string | null;

  @Column({ name: 'imagen_url', type: 'nvarchar', length: 500, nullable: true })
  imagenUrl?: string | null;

  @Column({
    name: 'precio_venta_estandar_con_iva',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precioVentaEstandarConIva?: number | null;

  @Column({
    name: 'costo_referencia',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costoReferencia?: number | null;

  @Column({ name: 'observaciones', type: 'nvarchar', nullable: true })
  observaciones?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @ManyToOne(() => Categoria, { nullable: true })
  @JoinColumn({ name: 'id_categoria' })
  categoria?: Categoria | null;

  @ManyToOne(() => TarifaIva, { nullable: true })
  @JoinColumn({ name: 'id_tarifa_iva' })
  tarifaIva?: TarifaIva | null;
}