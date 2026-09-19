import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { ConsultaAuditoriaMovimientosDto } from './dto/consulta-auditoria-movimientos.dto';
import { ConsultaAuditoriaDto } from './dto/consulta-auditoria.dto';
import { ReportesService } from './reportes.service';

@Roles(RolUsuario.ADMIN)
@Controller('reportes/auditoria')
export class ReportesAuditoriaController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  resumenAuditoria() {
    return this.reportesService.resumenAuditoria();
  }

  @Get('usuarios')
  actividadPorUsuario(@Query() dto: ConsultaAuditoriaDto) {
    return this.reportesService.actividadPorUsuario(dto);
  }

  @Get('movimientos')
  movimientosAuditoria(@Query() dto: ConsultaAuditoriaMovimientosDto) {
    return this.reportesService.movimientosAuditoria(dto);
  }

  @Get('pagos')
  pagosAuditoria(@Query() dto: ConsultaAuditoriaDto) {
    return this.reportesService.pagosAuditoria(dto);
  }

  @Get('legacy')
  legacyAuditoria() {
    return this.reportesService.legacyAuditoria();
  }
}
