import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RolUsuario } from '../../modules/usuarios/rol-usuario.enum';

@Entity({ name: 'usuario' })
@Index('UX_usuario_username_normalizado', ['usernameNormalizado'], {
  unique: true,
})
@Check('CK_usuario_username_longitud', 'char_length(trim("username")) >= 3')
@Check(
  'CK_usuario_username_normalizado_longitud',
  'char_length(trim("username_normalizado")) >= 3',
)
@Check('CK_usuario_rol_valido', '"rol" IN (\'ADMIN\', \'OPERADOR\', \'CONSULTA\')')
@Check('CK_usuario_version_credenciales', '"version_credenciales" >= 1')
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
    type: 'boolean',
    default: true,
  })
  activo!: boolean;

  @Column({
    name: 'version_credenciales',
    type: 'int',
    default: 1,
  })
  versionCredenciales!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
