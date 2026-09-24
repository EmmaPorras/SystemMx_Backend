import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { RecepcionPedidoDto } from './dto/recepcion-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PedidosService } from './pedidos.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import type { UsuarioPublico } from '../usuarios/usuarios.types';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Get('productos-sugeridos')
  buscarProductosSugeridos(@Query('busqueda') busqueda = '') {
    return this.pedidosService.buscarProductosSugeridos(busqueda);
  }

  @Get('siguiente-numero')
  obtenerSiguienteNumero() {
    return this.pedidosService.obtenerSiguienteNumero();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Post()
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidosService.create(createPedidoDto);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Patch(':id/recepcion')
  recibir(
    @Param('id', ParseIntPipe) id: number,
    @Body() recepcionPedidoDto: RecepcionPedidoDto,
    @CurrentUser() usuario: UsuarioPublico,
  ) {
    return this.pedidosService.recibir(id, recepcionPedidoDto, usuario);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidosService.update(id, updatePedidoDto);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.remove(id);
  }
}

