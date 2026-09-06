import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from '../../database/entities/usuario.entity';
import { PasswordHasherService } from './password-hasher.service';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [PasswordHasherService, UsuariosService],
  exports: [PasswordHasherService, UsuariosService],
})
export class UsuariosModule {}
