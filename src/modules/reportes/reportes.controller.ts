import { Controller, Get, Query } from '@nestjs/common';

import { ConsultaResumenDto } from './dto/consulta-resumen.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  resumen(@Query() dto: ConsultaResumenDto) {
    return this.reportesService.resumen(dto);
  }
}
