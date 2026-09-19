import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PagoVenta } from '../../../database/entities/pago-venta.entity';
import { VentaEntity } from '../../../database/entities/venta.entity';
import { ConsultaPeriodoDto } from '../dto/consulta-periodo.dto';
import { ConsultaVencimientosDto } from '../dto/consulta-vencimientos.dto';
import { aplicarPeriodoDatetime } from '../utils/reportes-query.utils';
import {
  formatearFecha,
  redondear,
  validarFechaIso,
  validarPeriodo,
} from '../utils/reportes.utils';

@Injectable()
export class ReportesPagosService {
  constructor(
    @InjectRepository(PagoVenta)
    private readonly pagosRepository: Repository<PagoVenta>,

    @InjectRepository(VentaEntity)
    private readonly ventasRepository: Repository<VentaEntity>,
  ) {}

  async resumenPagos(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.id_venta = pago.id_venta')
      .select('COUNT(*)', 'cantidadPagos')
      .addSelect('COUNT(DISTINCT pago.id_venta)', 'ventasConPago')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoRegistrado')
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estado_venta <> :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasActivas',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estado_venta = :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasAnuladas',
      )
      .setParameter('anulada', 'ANULADA');

    aplicarPeriodoDatetime(query, 'pago.created_at', dto);

    const raw = await query.getRawOne<{
      cantidadPagos: string;
      ventasConPago: string;
      montoRegistrado: string;
      montoVentasActivas: string;
      montoVentasAnuladas: string;
    }>();

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      cantidadPagos: Number(raw?.cantidadPagos ?? 0),
      ventasConPago: Number(raw?.ventasConPago ?? 0),
      montoRegistrado: redondear(Number(raw?.montoRegistrado ?? 0)),
      montoVentasActivas: redondear(Number(raw?.montoVentasActivas ?? 0)),
      montoVentasAnuladas: redondear(Number(raw?.montoVentasAnuladas ?? 0)),
    };
  }

  async pagosPorMetodo(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.id_venta = pago.id_venta')
      .select('pago.metodo_pago', 'metodoPago')
      .addSelect('COUNT(*)', 'pagos')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoTotal')
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estado_venta <> :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasActivas',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estado_venta = :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasAnuladas',
      )
      .setParameter('anulada', 'ANULADA')
      .groupBy('pago.metodo_pago')
      .orderBy('SUM(pago.monto)', 'DESC')
      .addOrderBy('pago.metodo_pago', 'ASC');

    aplicarPeriodoDatetime(query, 'pago.created_at', dto);

    const filas = await query.getRawMany<{
      metodoPago: string;
      pagos: string;
      montoTotal: string;
      montoVentasActivas: string;
      montoVentasAnuladas: string;
    }>();

    return filas.map((fila) => ({
      metodoPago: fila.metodoPago,
      pagos: Number(fila.pagos ?? 0),
      montoTotal: redondear(Number(fila.montoTotal ?? 0)),
      montoVentasActivas: redondear(Number(fila.montoVentasActivas ?? 0)),
      montoVentasAnuladas: redondear(Number(fila.montoVentasAnuladas ?? 0)),
    }));
  }

  async evolucionPagos(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

    const expresionFecha = 'CAST(pago.created_at AS date)';

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.id_venta = pago.id_venta')
      .select(expresionFecha, 'fecha')
      .addSelect('COUNT(*)', 'pagos')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoTotal')
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estado_venta <> :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasActivas',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estado_venta = :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasAnuladas',
      )
      .setParameter('anulada', 'ANULADA')
      .groupBy(expresionFecha)
      .orderBy(expresionFecha, 'ASC');

    aplicarPeriodoDatetime(query, 'pago.created_at', dto);

    const filas = await query.getRawMany<{
      fecha: unknown;
      pagos: string;
      montoTotal: string;
      montoVentasActivas: string;
      montoVentasAnuladas: string;
    }>();

    return filas.map((fila) => ({
      fecha: formatearFecha(fila.fecha),
      pagos: Number(fila.pagos ?? 0),
      montoTotal: redondear(Number(fila.montoTotal ?? 0)),
      montoVentasActivas: redondear(Number(fila.montoVentasActivas ?? 0)),
      montoVentasAnuladas: redondear(Number(fila.montoVentasAnuladas ?? 0)),
    }));
  }

  async conciliacionPagos() {
    const filas = await this.ventasRepository
      .createQueryBuilder('venta')
      .leftJoin(PagoVenta, 'pago', 'pago.id_venta = venta.id_venta')
      .select('venta.id_venta', 'idVenta')
      .addSelect('venta.numero_venta', 'numeroVenta')
      .addSelect('venta.fecha_venta', 'fechaVenta')
      .addSelect('venta.total_venta', 'totalVenta')
      .addSelect('venta.monto_pagado', 'montoPagadoVenta')
      .addSelect('venta.saldo_pendiente', 'saldoPendiente')
      .addSelect('COUNT(pago.id_pago_venta)', 'cantidadPagosLedger')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoLedger')
      .where('venta.estado_venta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('venta.id_venta')
      .addGroupBy('venta.numero_venta')
      .addGroupBy('venta.fecha_venta')
      .addGroupBy('venta.total_venta')
      .addGroupBy('venta.monto_pagado')
      .addGroupBy('venta.saldo_pendiente')
      .orderBy('venta.id_venta', 'ASC')
      .getRawMany<{
        idVenta: string | number;
        numeroVenta: string;
        fechaVenta: unknown;
        totalVenta: string;
        montoPagadoVenta: string;
        saldoPendiente: string;
        cantidadPagosLedger: string;
        montoLedger: string;
      }>();

    const detalle = filas.map((fila) => {
      const montoPagadoVenta = Number(fila.montoPagadoVenta ?? 0);
      const montoLedger = Number(fila.montoLedger ?? 0);
      const diferencia = redondear(montoPagadoVenta - montoLedger);

      let estado:
        'CONCILIADA' | 'HISTORIAL_INCOMPLETO' | 'INCONSISTENTE_EXCESO_LEDGER';

      if (Math.abs(diferencia) < 0.01) {
        estado = 'CONCILIADA';
      } else if (diferencia > 0) {
        estado = 'HISTORIAL_INCOMPLETO';
      } else {
        estado = 'INCONSISTENTE_EXCESO_LEDGER';
      }

      return {
        idVenta: Number(fila.idVenta),
        numeroVenta: fila.numeroVenta,
        fechaVenta: formatearFecha(fila.fechaVenta),
        totalVenta: redondear(Number(fila.totalVenta ?? 0)),
        montoPagadoVenta: redondear(montoPagadoVenta),
        saldoPendiente: redondear(Number(fila.saldoPendiente ?? 0)),
        cantidadPagosLedger: Number(fila.cantidadPagosLedger ?? 0),
        montoLedger: redondear(montoLedger),
        diferencia,
        estado,
      };
    });

    const conciliadas = detalle.filter((item) => item.estado === 'CONCILIADA');
    const incompletas = detalle.filter(
      (item) => item.estado === 'HISTORIAL_INCOMPLETO',
    );
    const inconsistentes = detalle.filter(
      (item) => item.estado === 'INCONSISTENTE_EXCESO_LEDGER',
    );

    const montoPagadoVenta = detalle.reduce(
      (sum, item) => sum + item.montoPagadoVenta,
      0,
    );
    const montoLedger = detalle.reduce(
      (sum, item) => sum + item.montoLedger,
      0,
    );

    return {
      resumen: {
        ventasActivas: detalle.length,
        conciliadas: conciliadas.length,
        historialIncompleto: incompletas.length,
        inconsistentes: inconsistentes.length,
        montoPagadoVenta: redondear(montoPagadoVenta),
        montoLedger: redondear(montoLedger),
        diferenciaCobertura: redondear(montoPagadoVenta - montoLedger),
      },
      detalle,
    };
  }

  async cuentasPorCobrar() {
    const ventas = await this.ventasRepository
      .createQueryBuilder('venta')
      .select('venta.id_venta', 'idVenta')
      .addSelect('venta.numero_venta', 'numeroVenta')
      .addSelect('venta.fecha_venta', 'fechaVenta')
      .addSelect('venta.cliente_nombre', 'clienteNombre')
      .addSelect('venta.estado_pago', 'estadoPago')
      .addSelect('venta.total_venta', 'totalVenta')
      .addSelect('venta.monto_pagado', 'montoPagado')
      .addSelect('venta.saldo_pendiente', 'saldoPendiente')
      .addSelect('venta.fecha_vencimiento_pago', 'fechaVencimientoPago')
      .where('venta.estado_venta <> :anulada', {
        anulada: 'ANULADA',
      })
      .andWhere('venta.saldo_pendiente > 0')
      .orderBy(
        `CASE
          WHEN venta.fecha_vencimiento_pago IS NULL
          THEN 1
          ELSE 0
        END`,
        'ASC',
      )
      .addOrderBy('venta.fecha_vencimiento_pago', 'ASC')
      .addOrderBy('venta.fecha_venta', 'ASC')
      .addOrderBy('venta.id_venta', 'ASC')
      .getRawMany<{
        idVenta: string | number;
        numeroVenta: string;
        fechaVenta: unknown;
        clienteNombre: string | null;
        estadoPago: string;
        totalVenta: string;
        montoPagado: string;
        saldoPendiente: string;
        fechaVencimientoPago: unknown;
      }>();

    const detalle = ventas.map((venta) => ({
      idVenta: Number(venta.idVenta),
      numeroVenta: venta.numeroVenta,
      fechaVenta: formatearFecha(venta.fechaVenta),
      cliente: venta.clienteNombre?.trim() || 'Venta mostrador',
      estadoPago: venta.estadoPago,
      totalVenta: redondear(Number(venta.totalVenta ?? 0)),
      montoPagado: redondear(Number(venta.montoPagado ?? 0)),
      saldoPendiente: redondear(Number(venta.saldoPendiente ?? 0)),
      fechaVencimientoPago: venta.fechaVencimientoPago
        ? formatearFecha(venta.fechaVencimientoPago)
        : null,
    }));

    return {
      resumen: {
        ventasConSaldo: detalle.length,
        totalPorCobrar: redondear(
          detalle.reduce((sum, item) => sum + item.saldoPendiente, 0),
        ),
      },
      detalle,
    };
  }

  async vencimientosCuentasPorCobrar(dto: ConsultaVencimientosDto) {
    validarFechaIso(dto.fechaCorte, 'fechaCorte');

    const raw = await this.ventasRepository
      .createQueryBuilder('venta')
      .select(
        `SUM(
          CASE
            WHEN venta.fecha_vencimiento_pago IS NULL
            THEN 1
            ELSE 0
          END
        )`,
        'sinVencimientoCantidad',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.fecha_vencimiento_pago IS NULL
              THEN venta.saldo_pendiente
              ELSE 0
            END
          ),
          0
        )`,
        'sinVencimientoSaldo',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN venta.fecha_vencimiento_pago < :fechaCorte
            THEN 1
            ELSE 0
          END
        )`,
        'vencidasCantidad',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.fecha_vencimiento_pago < :fechaCorte
              THEN venta.saldo_pendiente
              ELSE 0
            END
          ),
          0
        )`,
        'vencidasSaldo',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN venta.fecha_vencimiento_pago = :fechaCorte
            THEN 1
            ELSE 0
          END
        )`,
        'venceHoyCantidad',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.fecha_vencimiento_pago = :fechaCorte
              THEN venta.saldo_pendiente
              ELSE 0
            END
          ),
          0
        )`,
        'venceHoySaldo',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN venta.fecha_vencimiento_pago > :fechaCorte
            THEN 1
            ELSE 0
          END
        )`,
        'porVencerCantidad',
      )
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.fecha_vencimiento_pago > :fechaCorte
              THEN venta.saldo_pendiente
              ELSE 0
            END
          ),
          0
        )`,
        'porVencerSaldo',
      )
      .where('venta.estado_venta <> :anulada', {
        anulada: 'ANULADA',
      })
      .andWhere('venta.saldo_pendiente > 0')
      .setParameter('fechaCorte', dto.fechaCorte)
      .getRawOne<{
        sinVencimientoCantidad: string;
        sinVencimientoSaldo: string;
        vencidasCantidad: string;
        vencidasSaldo: string;
        venceHoyCantidad: string;
        venceHoySaldo: string;
        porVencerCantidad: string;
        porVencerSaldo: string;
      }>();

    return {
      fechaCorte: dto.fechaCorte,
      sinVencimiento: {
        cantidad: Number(raw?.sinVencimientoCantidad ?? 0),
        saldo: redondear(Number(raw?.sinVencimientoSaldo ?? 0)),
      },
      vencidas: {
        cantidad: Number(raw?.vencidasCantidad ?? 0),
        saldo: redondear(Number(raw?.vencidasSaldo ?? 0)),
      },
      venceEnFechaCorte: {
        cantidad: Number(raw?.venceHoyCantidad ?? 0),
        saldo: redondear(Number(raw?.venceHoySaldo ?? 0)),
      },
      porVencer: {
        cantidad: Number(raw?.porVencerCantidad ?? 0),
        saldo: redondear(Number(raw?.porVencerSaldo ?? 0)),
      },
    };
  }
}
