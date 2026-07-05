import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from './producto.entity';

@Entity({ name: 'categoria' })
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  idCategoria!: number;

  @Column({ name: 'nombre', type: 'nvarchar', length: 100 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'nvarchar', nullable: true })
  descripcion?: string;

  @Column({ name: 'activo', type: 'bit', default: true })
  activo!: boolean;

  @Column({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos!: Producto[];
}