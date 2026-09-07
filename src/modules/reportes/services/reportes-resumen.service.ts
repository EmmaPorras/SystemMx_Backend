import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoteProducto } from '../../../database/entities/lote-producto.entity';
import { PedidoCompraEntity } from '../../../database/entities/pedido-compra.entity';
import { VentaEntity } from '../../../database/entities/venta.entity';
import { ConsultaPeriodoDto } from '../dto/consulta-periodo.dto';
import { ConsultaResumenDto } from '../dto/consulta-resumen.dto';
import { aplicarPeriodo } from '../utils/reportes-query.utils';
import { redondear, validarPeriodo } from '../utils/reportes.utils';

@Injectable()
export class ReportesResumenService {
  constructor(
    @InjectRepository(VentaEntity)
    private readonly ventasRepository: Repository<VentaEntity>,

    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,

    @InjectRepository(PedidoCompraEntity)
    private readonly pedidosRepository: Repository<PedidoCompraEntity>,
  ) {}

  private async obtenerResumenVentas(dto: ConsultaPeriodoDto) {
    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(venta.total_venta), 0)', 'total')
      .addSelect('COALESCE(SUM(venta.costo_total), 0)', 'costo')
      .addSelect('COALESCE(SUM(venta.ganancia_bruta), 0)', 'gananciaBruta')
      .addSelect('COALESCE(SUM(venta.monto_pagado), 0)', 'montoPagado')
      .addSelect('COALESCE(SUM(venta.saldo_pendiente), 0)', 'saldoPendiente')
      .where('venta.estado_venta <> :anulada', {
        anulada: 'ANULADA',
      });

    aplicarPeriodo(query, 'venta.fecha_venta', dto);

    const raw = await query.getRawOne<{
      cantidad: string;
      total: string;
      costo: string;
      gananciaBruta: string;
      montoPagado: string;
      saldoPendiente: string;
    }>();

    const total = Number(raw?.total ?? 0);
    const costo = Number(raw?.costo ?? 0);
    const gananciaBruta = Number(raw?.gananciaBruta ?? 0);
    const montoPagado = Number(raw?.montoPagado ?? 0);
    const saldoPendiente = Number(raw?.saldoPendiente ?? 0);

    const margenBrutoPorcentaje = total > 0 ? (gananciaBruta / total) * 100 : 0;

    return {
      cantidad: Number(raw?.cantidad ?? 0),
      total: redondear(total),
      costo: redondear(costo),
      gananciaBruta: redondear(gananciaBruta),
      margenBrutoPorcentaje: redondear(margenBrutoPorcentaje),
      montoPagado: redondear(montoPagado),
      saldoPendiente: redondear(saldoPendiente),
    };
  }

  private async obtenerResumenInventario() {
    const raw = await this.lotesRepository
      .createQueryBuilder('lote')
      .select(
        `SUM(
          CASE
            WHEN lote.cantidad_disponible > 0
            THEN 1
            ELSE 0
          END
        )`,
        'lotesConStock',
      )
      .addSelect(
        'COALESCE(SUM(lote.cantidad_disponible), 0)',
        'unidadesDisponibles',
      )
      .addSelect(
        `COALESCE(
          SUM(lote.cantidad_disponible * lote.costo_unitario_real),
          0
        )`,
        'valorCosto',
      )
      .getRawOne<{
        lotesConStock: string;
        unidadesDisponibles: string;
        valorCosto: string;
      }>();

    return {
      lotesConStock: Number(raw?.lotesConStock ?? 0),
      unidadesDisponibles: Number(raw?.unidadesDisponibles ?? 0),
      valorCosto: redondear(Number(raw?.valorCosto ?? 0)),
    };
  }

  private async obtenerResumenCuentasPorCobrar() {
    const raw = await this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'ventasConSaldo')
      .addSelect('COALESCE(SUM(venta.saldo_pendiente), 0)', 'saldo')
      .where('venta.estado_venta <> :anulada', {
        anulada: 'ANULADA',
      })
      .andWhere('venta.saldo_pendiente > 0')
      .getRawOne<{
        ventasConSaldo: string;
        saldo: string;
      }>();

    return {
      ventasConSaldo: Number(raw?.ventasConSaldo ?? 0),
      saldo: redondear(Number(raw?.saldo ?? 0)),
    };
  }

  private async obtenerResumenPedidos(dto: ConsultaPeriodoDto) {
    const query = this.pedidosRepository
      .createQueryBuilder('pedido')
      .select('pedido.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad');

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

    const filas = await query
      .groupBy('pedido.estado')
      .getRawMany<{ estado: string; cantidad: string }>();

    let registrados = 0;
    let enTransito = 0;
    let recibidos = 0;
    let cancelados = 0;

    for (const fila of filas) {
      const cantidad = Number(fila.cantidad ?? 0);
      switch (fila.estado) {
        case 'REGISTRADO':
          registrados = cantidad;
          break;
        case 'EN_TRANSITO':
          enTransito = cantidad;
          break;
        case 'RECIBIDO':
          recibidos = cantidad;
          break;
        case 'CANCELADO':
          cancelados = cantidad;
          break;
      }
    }

    return {
      registrados,
      enTransito,
      recibidos,
      cancelados,
      pendientes: registrados + enTransito,
      total: registrados + enTransito + recibidos + cancelados,
    };
  }

  async resumen(dto: ConsultaResumenDto) {
    validarPeriodo(dto);

    const [ventas, inventario, cuentasPorCobrar, pedidos] = await Promise.all([
      this.obtenerResumenVentas(dto),
      this.obtenerResumenInventario(),
      this.obtenerResumenCuentasPorCobrar(),
      this.obtenerResumenPedidos(dto),
    ]);

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      ventas,
      inventario,
      cuentasPorCobrar,
      pedidos,
    };
  }
}
