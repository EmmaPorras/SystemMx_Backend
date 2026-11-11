import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TipoTokenAccion } from '../../modules/usuarios/tipo-token-accion.enum';
import { Usuario } from './usuario.entity';
import { resolveColumnType, resolveSqlExpr } from '../column-types';

@Entity({ name: 'token_accion_usuario' })
@Index('IX_token_accion_hash', ['tokenHash'])
@Index('IX_token_accion_usuario_tipo', ['idUsuario', 'tipo', 'usado'])
@Check(
  'CK_token_accion_tipo',
  "\"tipo\" IN ('INVITACION', 'RECUPERACION_PASSWORD')",
)
export class TokenAccionUsuario {
  @PrimaryGeneratedColumn({
    name: 'id_token',
  })
  idToken!: number;

  @Column({
    name: 'id_usuario',
    type: 'int',
  })
  idUsuario!: number;

  @ManyToOne(() => Usuario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_usuario',
    referencedColumnName: 'idUsuario',
  })
  usuario?: Usuario;

  @Column({
    name: 'tipo',
    type: 'varchar',
    length: 30,
  })
  tipo!: TipoTokenAccion;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 64,
  })
  tokenHash!: string;

  @Column({
    name: 'expira_en',
    type: resolveColumnType('timestamptz', 'datetime2'),
  })
  expiraEn!: Date;

  @Column({
    name: 'usado',
    type: resolveColumnType('boolean', 'bit'),
    default: false,
  })
  usado!: boolean;

  @Column({
    name: 'usado_en',
    type: resolveColumnType('timestamptz', 'datetime2'),
    nullable: true,
  })
  usadoEn!: Date | null;

  @Column({
    name: 'ip_solicitud',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  ipSolicitud!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: resolveColumnType('timestamptz', 'datetime2'),
    default: () => resolveSqlExpr('CURRENT_TIMESTAMP', 'GETDATE()'),
  })
  createdAt!: Date;
}
