import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { UsuarioPublico } from '../usuarios/usuarios.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { ActivarCuentaDto } from './dto/activar-cuenta.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';
import { RegistroDto } from './dto/registro.dto';
import { ReenviarActivacionDto } from './dto/reenviar-activacion.dto';
import { Public } from './public.decorator';
import { TipoTokenAccion } from '../usuarios/tipo-token-accion.enum';

type RequestConUsuario = Request & {
  user: UsuarioPublico;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  @Post('recuperar-password')
  @HttpCode(HttpStatus.OK)
  recuperarPassword(
    @Body() dto: SolicitarRecuperacionDto,
    @Req() req: Request,
  ) {
    return this.authService.solicitarRecuperacionPassword(dto, req.ip);
  }

  @Public()
  @Get('validar-token')
  validarToken(
    @Query('token') token: string,
    @Query('tipo') tipo?: TipoTokenAccion,
  ) {
    return this.authService.validarTokenAccion(token, tipo);
  }

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @Post('activar-cuenta')
  @HttpCode(HttpStatus.OK)
  activarCuenta(@Body() dto: ActivarCuentaDto) {
    return this.authService.activarCuenta(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @Post('restablecer-password')
  @HttpCode(HttpStatus.OK)
  restablecerPassword(@Body() dto: RestablecerPasswordDto) {
    return this.authService.restablecerPassword(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  registro(@Body() dto: RegistroDto, @Req() req: Request) {
    return this.authService.registrarPublico(dto, req.ip);
  }

  @Public()
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  @Post('reenviar-activacion')
  @HttpCode(HttpStatus.OK)
  reenviarActivacion(@Body() dto: ReenviarActivacionDto, @Req() req: Request) {
    return this.authService.reenviarActivacion(dto, req.ip);
  }

  @Get('me')
  me(
    @Req()
    request: RequestConUsuario,
  ) {
    return request.user;
  }
}
