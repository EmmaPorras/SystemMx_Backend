import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PedidoCompraEntity,
      DetallePedidoCompra,
      LoteProducto,
    ]),
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}