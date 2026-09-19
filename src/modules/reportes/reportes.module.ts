import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { PagoVenta } from '../../database/entities/pago-venta.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { Usuario } from '../../database/entities/usuario.entity';
import { VentaEntity } from '../../database/entities/venta.entity';

import { ReportesAuditoriaController } from './reportes-auditoria.controller';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReportesAuditoriaService } from './services/reportes-auditoria.service';
import { ReportesComprasService } from './services/reportes-compras.service';
import { ReportesInventarioService } from './services/reportes-inventario.service';
import { ReportesPagosService } from './services/reportes-pagos.service';
import { ReportesResumenService } from './services/reportes-resumen.service';
import { ReportesVentasService } from './services/reportes-ventas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VentaEntity,
      DetalleVenta,
      PedidoCompraEntity,
      DetallePedidoCompra,
      Producto,
      Categoria,
      OrigenCompra,
      LoteProducto,
      MovimientoInventario,
      PagoVenta,
      Usuario,
    ]),
  ],
  controllers: [ReportesController, ReportesAuditoriaController],
  providers: [
    ReportesService,
    ReportesResumenService,
    ReportesVentasService,
    ReportesInventarioService,
    ReportesComprasService,
    ReportesPagosService,
    ReportesAuditoriaService,
  ],
  exports: [
    ReportesService,
    ReportesResumenService,
    ReportesVentasService,
    ReportesInventarioService,
    ReportesComprasService,
    ReportesPagosService,
    ReportesAuditoriaService,
  ],
})
export class ReportesModule {}
