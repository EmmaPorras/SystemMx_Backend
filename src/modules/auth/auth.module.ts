import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsuariosModule } from '../usuarios/usuarios.module';
import { obtenerJwtExpiresSeconds, obtenerJwtSecret } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    UsuariosModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: obtenerJwtSecret(configService),

        signOptions: {
          expiresIn: obtenerJwtExpiresSeconds(configService),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtAuthGuard],

  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
