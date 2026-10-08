import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { Controller, Get, Query } from '@nestjs/common';

import { ConsultaInventarioHistoricoDto } from './dto/consulta-inventario-historico.dto';
import { ConsultaPeriodoDto } from './dto/consulta-periodo.dto';
import { ConsultaResumenDto } from './dto/consulta-resumen.dto';
import { ConsultaVencimientosDto } from './dto/consulta-vencimientos.dto';
import { ReportesService } from './reportes.service';

@Roles(RolUsuario.ADMIN, RolUsuario.CONSULTA)
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

  @Get('compras/resumen')
  resumenCompras(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.resumenCompras(dto);
  }

  @Get('compras/evolucion')
  evolucionCompras(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.evolucionCompras(dto);
  }

  @Get('compras/proveedores')
  comprasPorProveedor(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.comprasPorProveedor(dto);
  }

  @Get('compras/productos')
  comprasPorProducto(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.comprasPorProducto(dto);
  }

  @Get('compras/costos')
  composicionCostosCompras(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.composicionCostosCompras(dto);
  }

  @Get('compras/canceladas')
  comprasCanceladas(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.comprasCanceladas(dto);
  }

  @Get('pagos/resumen')
  resumenPagos(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.resumenPagos(dto);
  }

  @Get('pagos/evolucion')
  evolucionPagos(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.evolucionPagos(dto);
  }

  @Get('pagos/metodos')
  pagosPorMetodo(@Query() dto: ConsultaPeriodoDto) {
    return this.reportesService.pagosPorMetodo(dto);
  }

  @Get('pagos/conciliacion')
  conciliacionPagos() {
    return this.reportesService.conciliacionPagos();
  }

  @Get('cuentas-por-cobrar/vencimientos')
  vencimientosCuentasPorCobrar(@Query() dto: ConsultaVencimientosDto) {
    return this.reportesService.vencimientosCuentasPorCobrar(dto);
  }

  @Get('cuentas-por-cobrar')
  cuentasPorCobrar() {
    return this.reportesService.cuentasPorCobrar();
  }
}
