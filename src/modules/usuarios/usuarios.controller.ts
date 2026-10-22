import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { Roles } from '../auth/roles.decorator';
import { CambiarEstadoUsuarioDto } from './dto/cambiar-estado-usuario.dto';
import { CambiarPasswordUsuarioDto } from './dto/cambiar-password-usuario.dto';
import { CambiarRolUsuarioDto } from './dto/cambiar-rol-usuario.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { InvitarUsuarioDto } from './dto/invitar-usuario.dto';
import { RolUsuario } from './rol-usuario.enum';
import { UsuariosService } from './usuarios.service';

@Roles(RolUsuario.ADMIN)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  crear(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  @Post('invitar')
  invitar(@Body() dto: InvitarUsuarioDto, @Req() req: Request) {
    return this.usuariosService.invitar(dto, req.ip);
  }

  @Post(':id/reenviar-invitacion')
  reenviarInvitacion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.usuariosService.reenviarInvitacion(id, req.ip);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoUsuarioDto,
  ) {
    return this.usuariosService.cambiarEstado(id, dto.activo);
  }

  @Patch(':id/password')
  cambiarPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarPasswordUsuarioDto,
  ) {
    return this.usuariosService.cambiarPassword(id, dto.password);
  }

  @Patch(':id/rol')
  cambiarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarRolUsuarioDto,
  ) {
    return this.usuariosService.cambiarRol(id, dto.rol);
  }
}
