import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { InventarioService } from './inventario.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoInventario])],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
