import { resolveColumnType } from '../column-types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Producto } from './producto.entity';

@Entity({ name: 'categoria' })
@Index('UX_categoria_nombre', ['nombre'], { unique: true })
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  idCategoria!: number;

  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 100,
  })
  nombre!: string;

  @Column({
    name: 'descripcion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  descripcion?: string | null;

  @Column({
    name: 'activo',
    type: resolveColumnType('boolean', 'bit'),
    default: true,
  })
  activo!: boolean;

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

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos!: Producto[];
}
