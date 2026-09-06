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

  @Get(':id/pagos')
  listarPagos(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.listarPagosVenta(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVentaDto) {
    return this.ventasService.create(dto);
  }

  @Post(':id/pagos')
  registrarPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarPagoVentaDto,
  ) {
    return this.ventasService.registrarPago(id, dto);
  }

  @Patch(':id/papelera')
  enviarAPapelera(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.enviarAPapelera(id);
  }

  @Patch(':id/restaurar')
  restaurarDePapelera(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.restaurarDePapelera(id);
  }

  @Patch(':id/anular')
  anularVenta(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.anularVenta(id);
  }
}
