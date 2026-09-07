import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { VentaEntity } from '../../database/entities/venta.entity';

import { ConsultaResumenDto } from './dto/consulta-resumen.dto';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(VentaEntity)
    private readonly ventasRepository: Repository<VentaEntity>,

    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,

    @InjectRepository(PedidoCompraEntity)
    private readonly pedidosRepository: Repository<PedidoCompraEntity>,
  ) {}

  private validarFecha(value: string, campo: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${campo} debe tener formato YYYY-MM-DD.`);
    }

    const fecha = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`${campo} no es una fecha válida.`);
    }
  }

  private validarPeriodo(dto: ConsultaResumenDto): void {
    if (dto.fechaDesde) {
      this.validarFecha(dto.fechaDesde, 'fechaDesde');
    }

    if (dto.fechaHasta) {
      this.validarFecha(dto.fechaHasta, 'fechaHasta');
    }

    if (dto.fechaDesde && dto.fechaHasta && dto.fechaDesde > dto.fechaHasta) {
      throw new BadRequestException(
        'fechaDesde no puede ser posterior a fechaHasta.',
      );
    }
  }

  private aplicarPeriodo<T extends object>(
    query: SelectQueryBuilder<T>,
    aliasFecha: string,
    dto: ConsultaResumenDto,
  ): void {
    if (dto.fechaDesde) {
      query.andWhere(`${aliasFecha} >= :fechaDesde`, {
        fechaDesde: dto.fechaDesde,
      });
    }

    if (dto.fechaHasta) {
      query.andWhere(`${aliasFecha} <= :fechaHasta`, {
        fechaHasta: dto.fechaHasta,
      });
    }
  }

  private redondear(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async obtenerResumenVentas(dto: ConsultaResumenDto) {
    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(venta.totalVenta), 0)', 'total')
      .addSelect('COALESCE(SUM(venta.costoTotal), 0)', 'costo')
      .addSelect('COALESCE(SUM(venta.gananciaBruta), 0)', 'gananciaBruta')
      .addSelect('COALESCE(SUM(venta.montoPagado), 0)', 'montoPagado')
      .addSelect('COALESCE(SUM(venta.saldoPendiente), 0)', 'saldoPendiente')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      });

    this.aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const raw = await query.getRawOne<{
      cantidad: string;
      total: string;
      costo: string;
      gananciaBruta: string;
      montoPagado: string;
      saldoPendiente: string;
    }>();

    const cantidad = Number(raw?.cantidad ?? 0);
    const total = Number(raw?.total ?? 0);
    const costo = Number(raw?.costo ?? 0);
    const gananciaBruta = Number(raw?.gananciaBruta ?? 0);
    const montoPagado = Number(raw?.montoPagado ?? 0);
    const saldoPendiente = Number(raw?.saldoPendiente ?? 0);

    const margenBrutoPorcentaje =
      total > 0 ? this.redondear((gananciaBruta / total) * 100) : 0;

    return {
      cantidad,
      total: this.redondear(total),
      costo: this.redondear(costo),
      gananciaBruta: this.redondear(gananciaBruta),
      margenBrutoPorcentaje,
      montoPagado: this.redondear(montoPagado),
      saldoPendiente: this.redondear(saldoPendiente),
    };
  }

  private async obtenerResumenInventario() {
    const raw = await this.lotesRepository
      .createQueryBuilder('lote')
      .select('COUNT(*)', 'lotesConStock')
      .addSelect(
        'COALESCE(SUM(lote.cantidadDisponible), 0)',
        'unidadesDisponibles',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            lote.cantidad_disponible *
            lote.costo_unitario_real
          ),
          0
        )
        `,
        'valorCosto',
      )
      .where('lote.cantidadDisponible > 0')
      .getRawOne<{
        lotesConStock: string;
        unidadesDisponibles: string;
        valorCosto: string;
      }>();

    return {
      lotesConStock: Number(raw?.lotesConStock ?? 0),
      unidadesDisponibles: Number(raw?.unidadesDisponibles ?? 0),
      valorCosto: this.redondear(Number(raw?.valorCosto ?? 0)),
    };
  }

  private async obtenerCuentasPorCobrar() {
    const raw = await this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'ventasConSaldo')
      .addSelect('COALESCE(SUM(venta.saldoPendiente), 0)', 'saldo')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .andWhere('venta.saldoPendiente > 0')
      .getRawOne<{
        ventasConSaldo: string;
        saldo: string;
      }>();

    return {
      ventasConSaldo: Number(raw?.ventasConSaldo ?? 0),
      saldo: this.redondear(Number(raw?.saldo ?? 0)),
    };
  }

  private async obtenerResumenPedidos(dto: ConsultaResumenDto) {
    const query = this.pedidosRepository
      .createQueryBuilder('pedido')
      .select('pedido.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('pedido.estado');

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const filas = await query.getRawMany<{
      estado: string;
      cantidad: string;
    }>();

    const conteos = {
      REGISTRADO: 0,
      EN_TRANSITO: 0,
      RECIBIDO: 0,
      CANCELADO: 0,
    };

    for (const fila of filas) {
      if (fila.estado in conteos) {
        conteos[fila.estado as keyof typeof conteos] = Number(fila.cantidad);
      }
    }

    const registrados = conteos.REGISTRADO;
    const enTransito = conteos.EN_TRANSITO;
    const recibidos = conteos.RECIBIDO;
    const cancelados = conteos.CANCELADO;

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
    this.validarPeriodo(dto);

    const [ventas, inventario, cuentasPorCobrar, pedidos] = await Promise.all([
      this.obtenerResumenVentas(dto),
      this.obtenerResumenInventario(),
      this.obtenerCuentasPorCobrar(),
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
