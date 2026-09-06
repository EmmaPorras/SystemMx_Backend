import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../../database/entities/categoria.entity';
import { Producto } from '../../database/entities/producto.entity';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Categoria])],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
