import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarifaIva } from '../../database/entities/tarifa-iva.entity';
import { TarifasIvaController } from './tarifas-iva.controller';
import { TarifasIvaService } from './tarifas-iva.service';

@Module({
  imports: [TypeOrmModule.forFeature([TarifaIva])],
  controllers: [TarifasIvaController],
  providers: [TarifasIvaService],
})
export class TarifasIvaModule {}
