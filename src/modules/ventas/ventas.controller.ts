import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateVentaDto } from './dto/create-venta.dto';
import { RegistrarPagoVentaDto } from './dto/registrar-pago-venta.dto';
import { VentasService } from './ventas.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import type { UsuarioPublico } from '../usuarios/usuarios.types';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  findAll(
    @Query('papelera') papelera?: string,
    @Query('deudores') deudores?: string,
  ) {
    return this.ventasService.findAll({
      papelera,
      deudores,
    });
  }

  @Get('inventario-disponible')
  obtenerInventarioDisponible() {
    return this.ventasService.obtenerInventarioDisponible();
  }

  @Get('siguiente-numero')
  obtenerSiguienteNumero() {
    return this.ventasService.obtenerSiguienteNumero();
  }

  @Get(':id/pagos')
  listarPagos(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.listarPagosVenta(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Post()
  create(@Body() dto: CreateVentaDto, @CurrentUser() usuario: UsuarioPublico) {
    return this.ventasService.create(dto, usuario);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Post(':id/pagos')
  registrarPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarPagoVentaDto,
    @CurrentUser() usuario: UsuarioPublico,
  ) {
    return this.ventasService.registrarPago(id, dto, usuario);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Patch(':id/papelera')
  enviarAPapelera(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.enviarAPapelera(id);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Patch(':id/restaurar')
  restaurarDePapelera(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.restaurarDePapelera(id);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Patch(':id/anular')
  anularVenta(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: UsuarioPublico,
  ) {
    return this.ventasService.anularVenta(id, usuario);
  }
}
