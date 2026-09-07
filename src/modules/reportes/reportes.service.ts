import { Injectable } from '@nestjs/common';

import { ConsultaAuditoriaMovimientosDto } from './dto/consulta-auditoria-movimientos.dto';
import { ConsultaAuditoriaDto } from './dto/consulta-auditoria.dto';
import { ConsultaInventarioHistoricoDto } from './dto/consulta-inventario-historico.dto';
import { ConsultaPeriodoDto } from './dto/consulta-periodo.dto';
import { ConsultaResumenDto } from './dto/consulta-resumen.dto';
import { ConsultaVencimientosDto } from './dto/consulta-vencimientos.dto';
import { ReportesAuditoriaService } from './services/reportes-auditoria.service';
import { ReportesComprasService } from './services/reportes-compras.service';
import { ReportesInventarioService } from './services/reportes-inventario.service';
import { ReportesPagosService } from './services/reportes-pagos.service';
import { ReportesResumenService } from './services/reportes-resumen.service';
import { ReportesVentasService } from './services/reportes-ventas.service';

@Injectable()
export class ReportesService {
  constructor(
    private readonly resumenService: ReportesResumenService,
    private readonly ventasService: ReportesVentasService,
    private readonly inventarioService: ReportesInventarioService,
    private readonly comprasService: ReportesComprasService,
    private readonly pagosService: ReportesPagosService,
    private readonly auditoriaService: ReportesAuditoriaService,
  ) {}

  // ==========================================
  // 9B — DASHBOARD / RESUMEN
  // ==========================================
  resumen(dto: ConsultaResumenDto) {
    return this.resumenService.resumen(dto);
  }

  // ==========================================
  // 9C — VENTAS Y RENTABILIDAD
  // ==========================================
  resumenVentas(dto: ConsultaPeriodoDto) {
    return this.ventasService.resumenVentas(dto);
  }

  evolucionVentas(dto: ConsultaPeriodoDto) {
    return this.ventasService.evolucionVentas(dto);
  }

  ventasPorProducto(dto: ConsultaPeriodoDto) {
    return this.ventasService.ventasPorProducto(dto);
  }

  ventasPorLote(dto: ConsultaPeriodoDto) {
    return this.ventasService.ventasPorLote(dto);
  }

  ventasAnuladas(dto: ConsultaPeriodoDto) {
    return this.ventasService.ventasAnuladas(dto);
  }

  // ==========================================
  // 9D — INVENTARIO Y VALORIZACIÓN
  // ==========================================
  resumenInventario() {
    return this.inventarioService.resumenInventario();
  }

  inventarioPorProducto() {
    return this.inventarioService.inventarioPorProducto();
  }

  inventarioPorEstado() {
    return this.inventarioService.inventarioPorEstado();
  }

  productosSinStock() {
    return this.inventarioService.productosSinStock();
  }

  historicoInventario(dto: ConsultaInventarioHistoricoDto) {
    return this.inventarioService.historicoInventario(dto);
  }

  // ==========================================
  // 9E — COMPRAS Y PROVEEDORES
  // ==========================================
  resumenCompras(dto: ConsultaPeriodoDto) {
    return this.comprasService.resumenCompras(dto);
  }

  evolucionCompras(dto: ConsultaPeriodoDto) {
    return this.comprasService.evolucionCompras(dto);
  }

  comprasPorProveedor(dto: ConsultaPeriodoDto) {
    return this.comprasService.comprasPorProveedor(dto);
  }

  comprasPorProducto(dto: ConsultaPeriodoDto) {
    return this.comprasService.comprasPorProducto(dto);
  }

  composicionCostosCompras(dto: ConsultaPeriodoDto) {
    return this.comprasService.composicionCostosCompras(dto);
  }

  comprasCanceladas(dto: ConsultaPeriodoDto) {
    return this.comprasService.comprasCanceladas(dto);
  }

  // ==========================================
  // 9F — PAGOS Y CUENTAS POR COBRAR
  // ==========================================
  resumenPagos(dto: ConsultaPeriodoDto) {
    return this.pagosService.resumenPagos(dto);
  }

  pagosPorMetodo(dto: ConsultaPeriodoDto) {
    return this.pagosService.pagosPorMetodo(dto);
  }

  evolucionPagos(dto: ConsultaPeriodoDto) {
    return this.pagosService.evolucionPagos(dto);
  }

  conciliacionPagos() {
    return this.pagosService.conciliacionPagos();
  }

  cuentasPorCobrar() {
    return this.pagosService.cuentasPorCobrar();
  }

  vencimientosCuentasPorCobrar(dto: ConsultaVencimientosDto) {
    return this.pagosService.vencimientosCuentasPorCobrar(dto);
  }

  // ==========================================
  // 9G — AUDITORÍA Y ACTIVIDAD DE USUARIOS
  // ==========================================
  resumenAuditoria() {
    return this.auditoriaService.resumenAuditoria();
  }

  actividadPorUsuario(dto: ConsultaAuditoriaDto) {
    return this.auditoriaService.actividadPorUsuario(dto);
  }

  movimientosAuditoria(dto: ConsultaAuditoriaMovimientosDto) {
    return this.auditoriaService.movimientosAuditoria(dto);
  }

  pagosAuditoria(dto: ConsultaAuditoriaDto) {
    return this.auditoriaService.pagosAuditoria(dto);
  }

  legacyAuditoria() {
    return this.auditoriaService.legacyAuditoria();
  }
}
