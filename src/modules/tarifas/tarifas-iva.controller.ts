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
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';

@Roles(RolUsuario.ADMIN, RolUsuario.VENTAS, RolUsuario.COMPRAS, RolUsuario.CONSULTA)
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

  @Roles(RolUsuario.ADMIN)
  @Post()
  create(@Body() createTarifaIvaDto: CreateTarifaIvaDto) {
    return this.tarifasIvaService.create(createTarifaIvaDto);
  }

  @Roles(RolUsuario.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTarifaIvaDto: UpdateTarifaIvaDto,
  ) {
    return this.tarifasIvaService.update(id, updateTarifaIvaDto);
  }

  @Roles(RolUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarifasIvaService.remove(id);
  }
}
