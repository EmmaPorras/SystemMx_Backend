import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { Producto } from '../../database/entities/producto.entity';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, LoteProducto])],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
