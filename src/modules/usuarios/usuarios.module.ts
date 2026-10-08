import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { MailModule } from '../mail/mail.module';
import { PasswordHasherService } from './password-hasher.service';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, TokenAccionUsuario]),
    MailModule,
  ],
  controllers: [UsuariosController],
  providers: [PasswordHasherService, UsuariosService],
  exports: [PasswordHasherService, UsuariosService],
})
export class UsuariosModule {}
