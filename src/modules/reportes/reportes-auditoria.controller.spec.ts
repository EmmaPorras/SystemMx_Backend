import { Test, TestingModule } from '@nestjs/testing';

import { ConsultaAuditoriaMovimientosDto } from './dto/consulta-auditoria-movimientos.dto';
import { ConsultaAuditoriaDto } from './dto/consulta-auditoria.dto';
import { ReportesAuditoriaController } from './reportes-auditoria.controller';
import { ReportesService } from './reportes.service';

describe('ReportesAuditoriaController', () => {
  let controller: ReportesAuditoriaController;
  let reportesService: jest.Mocked<Partial<ReportesService>>;

  beforeEach(async () => {
    reportesService = {
      resumenAuditoria: jest.fn().mockResolvedValue({
        movimientos: {
          total: 50,
          auditados: 40,
          legacy: 10,
          coberturaPorcentaje: 80,
          usuariosIdentificados: 2,
        },
        pagos: {
          total: 12,
          auditados: 10,
          legacy: 2,
          coberturaPorcentaje: 83.33,
          usuariosIdentificados: 2,
        },
      }),
      actividadPorUsuario: jest.fn().mockResolvedValue([
        {
          idUsuario: 1,
          username: 'admin',
          nombre: 'Administrador',
          rol: 'ADMIN',
          movimientos: 3,
          entradas: 0,
          salidas: 0,
          reingresos: 3,
          unidadesMovidas: 3,
          pagosProcesados: 3,
          montoPagosProcesado: 19500,
        },
      ]),
      movimientosAuditoria: jest.fn().mockResolvedValue([
        {
          idMovimiento: 35,
          fechaMovimiento: '2026-09-12T15:30:00.000Z',
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 1,
          idUsuario: 2,
          usuarioActual: 'operador1',
          usuarioSnapshot: 'operador1',
          idProducto: 9,
          idLote: 17,
          referenciaTipo: 'VENTA',
          referenciaId: 12,
          costoUnitario: 4500,
          totalMovimiento: 4500,
          motivo: 'Venta realizada',
          observaciones: null,
        },
      ]),
      pagosAuditoria: jest.fn().mockResolvedValue([
        {
          idPagoVenta: 1,
          fecha: '2026-09-12T10:00:00.000Z',
          idVenta: 5,
          numeroVenta: '2165',
          estadoVenta: 'PAGADA',
          metodoPago: 'SINPE',
          monto: 6500,
          idUsuario: 1,
          usuarioActual: 'admin',
          usuarioSnapshot: 'admin',
          referencia: '12345',
          observaciones: null,
        },
      ]),
      legacyAuditoria: jest.fn().mockResolvedValue({
        movimientos: [
          { tipoMovimiento: 'ENTRADA_COMPRA', cantidad: 10, unidades: 50 },
        ],
        pagos: { cantidad: 2, monto: 5000 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesAuditoriaController],
      providers: [
        {
          provide: ReportesService,
          useValue: reportesService,
        },
      ],
    }).compile();

    controller = module.get<ReportesAuditoriaController>(
      ReportesAuditoriaController,
    );
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('GET /reportes/auditoria/resumen debe delegar al servicio', async () => {
    const res = await controller.resumenAuditoria();
    expect(reportesService.resumenAuditoria).toHaveBeenCalled();
    expect(res.movimientos.total).toBe(50);
  });

  it('GET /reportes/auditoria/usuarios debe delegar al servicio', async () => {
    const dto: ConsultaAuditoriaDto = { usuarioId: 1 };
    const res = await controller.actividadPorUsuario(dto);
    expect(reportesService.actividadPorUsuario).toHaveBeenCalledWith(dto);
    expect(res[0].idUsuario).toBe(1);
  });

  it('GET /reportes/auditoria/movimientos debe delegar al servicio', async () => {
    const dto: ConsultaAuditoriaMovimientosDto = {
      tipoMovimiento: 'SALIDA_VENTA',
    };
    const res = await controller.movimientosAuditoria(dto);
    expect(reportesService.movimientosAuditoria).toHaveBeenCalledWith(dto);
    expect(res[0].idMovimiento).toBe(35);
  });

  it('GET /reportes/auditoria/pagos debe delegar al servicio', async () => {
    const dto: ConsultaAuditoriaDto = { usuarioId: 1 };
    const res = await controller.pagosAuditoria(dto);
    expect(reportesService.pagosAuditoria).toHaveBeenCalledWith(dto);
    expect(res[0].idPagoVenta).toBe(1);
  });

  it('GET /reportes/auditoria/legacy debe delegar al servicio', async () => {
    const res = await controller.legacyAuditoria();
    expect(reportesService.legacyAuditoria).toHaveBeenCalled();
    expect(res.pagos.cantidad).toBe(2);
  });
});
