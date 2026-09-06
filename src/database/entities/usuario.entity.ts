import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'usuario' })
@Index('UX_usuario_username_normalizado', ['usernameNormalizado'], {
  unique: true,
})
@Check('CK_usuario_username_longitud', 'LEN(LTRIM(RTRIM([username]))) >= 3')
@Check(
  'CK_usuario_username_normalizado_longitud',
  'LEN(LTRIM(RTRIM([username_normalizado]))) >= 3',
)
export class Usuario {
  @PrimaryGeneratedColumn({
    name: 'id_usuario',
  })
  idUsuario!: number;

  @Column({
    name: 'username',
    type: 'nvarchar',
    length: 50,
  })
  username!: string;

  @Column({
    name: 'username_normalizado',
    type: 'nvarchar',
    length: 50,
  })
  usernameNormalizado!: string;

  @Column({
    name: 'nombre',
    type: 'nvarchar',
    length: 100,
  })
  nombre!: string;

  @Column({
    name: 'password_hash',
    type: 'nvarchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({
    name: 'activo',
    type: 'bit',
    default: () => '1',
  })
  activo!: boolean;

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
}
