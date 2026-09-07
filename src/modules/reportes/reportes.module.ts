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
import { VentaEntity } from '../../database/entities/venta.entity';

import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

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
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
