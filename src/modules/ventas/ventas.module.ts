import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PagoVenta } from '../../database/entities/pago-venta.entity';
import { Producto } from '../../database/entities/producto.entity';
import { VentaEntity } from '../../database/entities/venta.entity';
import { InventarioModule } from '../inventario/inventario.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VentaEntity,
      DetalleVenta,
      LoteProducto,
      Producto,
      PagoVenta,
    ]),
    InventarioModule,
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
