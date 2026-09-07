import { Controller, Get, Query } from '@nestjs/common';

import { ConsultaInventarioHistoricoDto } from './dto/consulta-inventario-historico.dto';
import { ConsultaPeriodoDto } from './dto/consulta-periodo.dto';
import { ConsultaResumenDto } from './dto/consulta-resumen.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  resumen(@Query() dto: ConsultaResumenDto) {
    return this.reportesService.resumen(dto);
  }

  @Get('ventas/resumen')
  resumenVentas(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.resumenVentas(dto);
  }

  @Get('ventas/evolucion')
  evolucionVentas(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.evolucionVentas(dto);
  }

  @Get('ventas/productos')
  ventasPorProducto(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.ventasPorProducto(dto);
  }

  @Get('ventas/lotes')
  ventasPorLote(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.ventasPorLote(dto);
  }

  @Get('ventas/anuladas')
  ventasAnuladas(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.ventasAnuladas(dto);
  }

  @Get('inventario/resumen')
  resumenInventario() {
    return this.reportesService.resumenInventario();
  }

  @Get('inventario/productos')
  inventarioPorProducto() {
    return this.reportesService.inventarioPorProducto();
  }

  @Get('inventario/estados')
  inventarioPorEstado() {
    return this.reportesService.inventarioPorEstado();
  }

  @Get('inventario/sin-stock')
  productosSinStock() {
    return this.reportesService.productosSinStock();
  }

  @Get('inventario/historico')
  historicoInventario(@Query() dto: ConsultaInventarioHistoricoDto) {
    return this.reportesService.historicoInventario(dto);
  }
}
