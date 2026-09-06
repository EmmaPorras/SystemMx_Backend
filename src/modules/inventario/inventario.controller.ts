import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { ConsultaLotesDto } from './dto/consulta-lotes.dto';
import { ConsultaMovimientosDto } from './dto/consulta-movimientos.dto';
import { InventarioService } from './inventario.service';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('lotes')
  listarLotes(@Query() query: ConsultaLotesDto) {
    return this.inventarioService.listarLotes(query);
  }

  @Get('productos/:productoId/lotes')
  listarLotesProducto(
    @Param('productoId', ParseIntPipe)
    productoId: number,

    @Query() query: ConsultaLotesDto,
  ) {
    return this.inventarioService.listarLotesProducto(productoId, query);
  }

  @Get('lotes/:id')
  buscarLote(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventarioService.buscarLotePorId(id);
  }

  @Get('movimientos')
  listarMovimientos(@Query() query: ConsultaMovimientosDto) {
    return this.inventarioService.listarMovimientos(query);
  }

  @Get('movimientos/:id')
  buscarMovimiento(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventarioService.buscarMovimientoPorId(id);
  }
}
