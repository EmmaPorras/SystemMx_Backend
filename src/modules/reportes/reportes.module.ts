import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
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
      Producto,
      Categoria,
      LoteProducto,
      MovimientoInventario,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
