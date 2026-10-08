import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RolUsuario } from '../../modules/usuarios/rol-usuario.enum';
import { EstadoActivacionUsuario } from '../../modules/usuarios/estado-activacion.enum';
import { TokenAccionUsuario } from './token-accion-usuario.entity';
import { resolveColumnType, resolveSqlExpr } from '../column-types';

@Entity({ name: 'usuario' })
@Index('UX_usuario_username_normalizado', ['usernameNormalizado'], {
  unique: true,
})
@Check(
  'CK_usuario_username_longitud',
  resolveSqlExpr(
    'char_length(trim("username")) >= 3',
    'LEN(LTRIM(RTRIM([username]))) >= 3',
  ),
)
@Check(
  'CK_usuario_username_normalizado_longitud',
  resolveSqlExpr(
    'char_length(trim("username_normalizado")) >= 3',
    'LEN(LTRIM(RTRIM([username_normalizado]))) >= 3',
  ),
)
@Check('CK_usuario_rol_valido', '"rol" IN (\'ADMIN\', \'OPERADOR\', \'CONSULTA\')')
@Check('CK_usuario_version_credenciales', '"version_credenciales" >= 1')
@Check(
  'CK_usuario_estado_activacion',
  '"estado_activacion" IN (\'ACTIVO\', \'PENDIENTE_ACTIVACION\')',
)
export class Usuario {
  @PrimaryGeneratedColumn({
    name: 'id_usuario',
  })
  idUsuario!: number;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 50,
  })
  username!: string;

  @Column({
    name: 'username_normalizado',
    type: 'varchar',
    length: 50,
  })
  usernameNormalizado!: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email!: string | null;

  @Column({
    name: 'email_normalizado',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emailNormalizado!: string | null;

  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 100,
  })
  nombre!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({
    name: 'rol',
    type: 'varchar',
    length: 30,
    default: RolUsuario.CONSULTA,
  })
  rol!: RolUsuario;

  @Column({
    name: 'activo',
    type: resolveColumnType('boolean', 'bit'),
    default: true,
  })
  activo!: boolean;

  @Column({
    name: 'estado_activacion',
    type: 'varchar',
    length: 30,
    default: EstadoActivacionUsuario.ACTIVO,
  })
  estadoActivacion!: EstadoActivacionUsuario;

  @Column({
    name: 'version_credenciales',
    type: 'int',
    default: 1,
  })
  versionCredenciales!: number;

  @OneToMany(() => TokenAccionUsuario, (token) => token.usuario)
  tokensAccion?: TokenAccionUsuario[];

  @CreateDateColumn({
    name: 'created_at',
    type: resolveColumnType('timestamptz', 'datetime2'),
    default: () => resolveSqlExpr('CURRENT_TIMESTAMP', 'GETDATE()'),
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: resolveColumnType('timestamptz', 'datetime2'),
    default: () => resolveSqlExpr('CURRENT_TIMESTAMP', 'GETDATE()'),
  })
  updatedAt!: Date;
}
