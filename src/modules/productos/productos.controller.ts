import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductosService } from './productos.service';

@Roles(
  RolUsuario.ADMIN,
  RolUsuario.VENTAS,
  RolUsuario.COMPRAS,
  RolUsuario.CONSULTA,
)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }
}
