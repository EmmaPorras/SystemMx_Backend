import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTarifaIvaDto } from './dto/create-tarifa-iva.dto';
import { UpdateTarifaIvaDto } from './dto/update-tarifa-iva.dto';
import { TarifasIvaService } from './tarifas-iva.service';

@Controller('tarifas-iva')
export class TarifasIvaController {
  constructor(private readonly tarifasIvaService: TarifasIvaService) {}

  @Get()
  findAll() {
    return this.tarifasIvaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarifasIvaService.findOne(id);
  }

  @Post()
  create(@Body() createTarifaIvaDto: CreateTarifaIvaDto) {
    return this.tarifasIvaService.create(createTarifaIvaDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTarifaIvaDto: UpdateTarifaIvaDto,
  ) {
    return this.tarifasIvaService.update(id, updateTarifaIvaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarifasIvaService.remove(id);
  }
}
