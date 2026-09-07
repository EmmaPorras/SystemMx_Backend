import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PasswordHasherService } from '../usuarios/password-hasher.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { obtenerJwtExpiresSeconds } from './auth.config';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,

    private readonly passwordHasher: PasswordHasherService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarParaAutenticacion(
      dto.username,
    );

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValido = await this.passwordHasher.verify(
      usuario.passwordHash,
      dto.password,
    );

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const expiresIn = obtenerJwtExpiresSeconds(this.configService);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: usuario.idUsuario,
        username: usuario.username,
      },
      {
        expiresIn,
      },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,

      usuario: {
        idUsuario: usuario.idUsuario,

        username: usuario.username,

        nombre: usuario.nombre,

        rol: usuario.rol,

        activo: usuario.activo,
      },
    };
  }
}
