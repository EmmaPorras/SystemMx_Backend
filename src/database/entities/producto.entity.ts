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

import { Categoria } from './categoria.entity';
import { TarifaIva } from './tarifa-iva.entity';

@Entity({ name: 'producto' })
@Index('UX_producto_nombre', ['nombre'], {
  unique: true,
})
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  idProducto!: number;

  @Column({ name: 'id_categoria', type: 'int', nullable: true })
  idCategoria?: number | null;

  @Column({ name: 'id_tarifa_iva', type: 'int', nullable: true })
  idTarifaIva?: number | null;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'varchar', nullable: true })
  descripcion?: string | null;

  @Column({ name: 'sku', type: 'varchar', length: 100, nullable: true })
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

  @Column({ name: 'activo', type: 'boolean' })
  activo!: boolean;

  @Column({ name: 'marca', type: 'varchar', length: 100, nullable: true })
  marca?: string | null;

  @Column({ name: 'variante', type: 'varchar', length: 100, nullable: true })
  variante?: string | null;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
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

  @Column({ name: 'observaciones', type: 'varchar', nullable: true })
  observaciones?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Categoria, { nullable: true })
  @JoinColumn({ name: 'id_categoria' })
  categoria?: Categoria | null;

  @ManyToOne(() => TarifaIva, { nullable: true })
  @JoinColumn({ name: 'id_tarifa_iva' })
  tarifaIva?: TarifaIva | null;
}
