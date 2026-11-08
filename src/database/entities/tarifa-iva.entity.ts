import { resolveColumnType } from '../column-types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const estadoTarifaTransformer = {
  to(value: string | boolean | null | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'ACTIVA';
  },

  from(value: boolean | number | null | undefined): string {
    return value === true || value === 1 ? 'ACTIVA' : 'INACTIVA';
  },
};

@Entity({ name: 'tarifa_iva' })
@Index('UX_tarifa_iva_codigo', ['codigo'], { unique: true })
export class TarifaIva {
  @PrimaryGeneratedColumn({ name: 'id_tarifa_iva' })
  idTarifaIva!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20 })
  codigo!: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 45 })
  descripcion!: string;

  @Column({
    name: 'porcentaje',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  porcentaje!: number;

  @Column({
    name: 'activo',
    type: resolveColumnType('boolean', 'bit'),
    transformer: estadoTarifaTransformer,
  })
  estado!: string;

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
}
