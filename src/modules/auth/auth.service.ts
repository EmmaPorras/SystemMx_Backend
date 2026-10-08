import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { EstadoActivacionUsuario } from '../usuarios/estado-activacion.enum';
import { PasswordHasherService } from '../usuarios/password-hasher.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { obtenerJwtExpiresSeconds } from './auth.config';
import { LoginDto } from './dto/login.dto';
import { ActivarCuentaDto } from './dto/activar-cuenta.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { TipoTokenAccion } from '../usuarios/tipo-token-accion.enum';

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

    if (usuario.estadoActivacion === EstadoActivacionUsuario.PENDIENTE_ACTIVACION) {
      throw new UnauthorizedException(
        'La cuenta está pendiente de activación. Por favor revisa tu correo electrónico para activarla.',
      );
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
        ver: usuario.versionCredenciales,
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

  async solicitarRecuperacionPassword(
    dto: SolicitarRecuperacionDto,
    reqIp?: string,
  ) {
    await this.usuariosService.solicitarRecuperacionPassword(
      dto.email,
      reqIp,
      dto.lang,
    );

    // Respuesta genérica para evitar enumeración de usuarios
    return {
      message:
        'Si el correo electrónico está registrado en el sistema, recibirás un enlace con instrucciones para restablecer tu contraseña.',
    };
  }

  async validarTokenAccion(token: string, tipo?: TipoTokenAccion) {
    const tokenEntity = await this.usuariosService.validarTokenAccion(token, tipo);

    return {
      valid: true,
      tipo: tokenEntity.tipo,
      nombre: tokenEntity.usuario?.nombre,
      username: tokenEntity.usuario?.username,
      email: tokenEntity.usuario?.email,
    };
  }

  async activarCuenta(dto: ActivarCuentaDto) {
    return this.usuariosService.activarCuentaConToken(dto.token, dto.password);
  }

  async restablecerPassword(dto: RestablecerPasswordDto) {
    return this.usuariosService.restablecerPasswordConToken(dto.token, dto.password);
  }
}
