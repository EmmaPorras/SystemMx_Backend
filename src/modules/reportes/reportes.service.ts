import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { VentaEntity } from '../../database/entities/venta.entity';

import { ConsultaPeriodoDto } from './dto/consulta-periodo.dto';
import { ConsultaResumenDto } from './dto/consulta-resumen.dto';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(VentaEntity)
    private readonly ventasRepository: Repository<VentaEntity>,

    @InjectRepository(DetalleVenta)
    private readonly detallesVentaRepository: Repository<DetalleVenta>,

    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,

    @InjectRepository(PedidoCompraEntity)
    private readonly pedidosRepository: Repository<PedidoCompraEntity>,

    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,

    @InjectRepository(Categoria)
    private readonly categoriasRepository: Repository<Categoria>,
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

  private validarPeriodo(dto: ConsultaPeriodoDto): void {
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
    dto: ConsultaPeriodoDto,
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

  private formatearFecha(fecha: unknown): string {
    if (typeof fecha === 'string') {
      return fecha.slice(0, 10);
    }
    if (fecha instanceof Date) {
      return fecha.toISOString().slice(0, 10);
    }
    return String(fecha).slice(0, 10);
  }

  private async obtenerResumenVentas(dto: ConsultaPeriodoDto) {
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

  private async obtenerResumenPedidos(dto: ConsultaPeriodoDto) {
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

  // --- ETAPA 9C: Reportes Analíticos de Ventas y Rentabilidad ---

  async resumenVentas(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'cantidadVentas')
      .addSelect('COALESCE(SUM(venta.subtotal), 0)', 'subtotal')
      .addSelect('COALESCE(SUM(venta.descuentoTotal), 0)', 'descuentos')
      .addSelect('COALESCE(SUM(venta.ivaTotal), 0)', 'iva')
      .addSelect('COALESCE(SUM(venta.totalVenta), 0)', 'ventas')
      .addSelect('COALESCE(SUM(venta.costoTotal), 0)', 'costo')
      .addSelect('COALESCE(SUM(venta.gananciaBruta), 0)', 'gananciaBruta')
      .addSelect('COALESCE(SUM(venta.montoPagado), 0)', 'montoPagado')
      .addSelect('COALESCE(SUM(venta.saldoPendiente), 0)', 'saldoPendiente')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      });

    this.aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const raw = await query.getRawOne<{
      cantidadVentas: string;
      subtotal: string;
      descuentos: string;
      iva: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
      montoPagado: string;
      saldoPendiente: string;
    }>();

    const ventas = Number(raw?.ventas ?? 0);
    const gananciaBruta = Number(raw?.gananciaBruta ?? 0);

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      cantidadVentas: Number(raw?.cantidadVentas ?? 0),
      subtotal: this.redondear(Number(raw?.subtotal ?? 0)),
      descuentos: this.redondear(Number(raw?.descuentos ?? 0)),
      iva: this.redondear(Number(raw?.iva ?? 0)),
      ventas: this.redondear(ventas),
      costo: this.redondear(Number(raw?.costo ?? 0)),
      gananciaBruta: this.redondear(gananciaBruta),
      margenBrutoPorcentaje:
        ventas > 0 ? this.redondear((gananciaBruta / ventas) * 100) : 0,
      montoPagado: this.redondear(Number(raw?.montoPagado ?? 0)),
      saldoPendiente: this.redondear(Number(raw?.saldoPendiente ?? 0)),
    };
  }

  async evolucionVentas(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .select('venta.fechaVenta', 'fecha')
      .addSelect('COUNT(*)', 'cantidadVentas')
      .addSelect('COALESCE(SUM(venta.totalVenta), 0)', 'ventas')
      .addSelect('COALESCE(SUM(venta.costoTotal), 0)', 'costo')
      .addSelect('COALESCE(SUM(venta.gananciaBruta), 0)', 'gananciaBruta')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('venta.fechaVenta')
      .orderBy('venta.fechaVenta', 'ASC');

    this.aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const filas = await query.getRawMany<{
      fecha: string | Date;
      cantidadVentas: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
    }>();

    return filas.map((fila) => {
      const ventas = Number(fila.ventas ?? 0);
      const ganancia = Number(fila.gananciaBruta ?? 0);

      return {
        fecha: this.formatearFecha(fila.fecha),
        cantidadVentas: Number(fila.cantidadVentas ?? 0),
        ventas: this.redondear(ventas),
        costo: this.redondear(Number(fila.costo ?? 0)),
        gananciaBruta: this.redondear(ganancia),
        margenBrutoPorcentaje:
          ventas > 0 ? this.redondear((ganancia / ventas) * 100) : 0,
      };
    });
  }

  async ventasPorProducto(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesVentaRepository
      .createQueryBuilder('detalle')
      .innerJoin(VentaEntity, 'venta', 'venta.idVenta = detalle.idVenta')
      .innerJoin(
        Producto,
        'producto',
        'producto.idProducto = detalle.idProducto',
      )
      .leftJoin(
        Categoria,
        'categoria',
        'categoria.idCategoria = producto.idCategoria',
      )
      .select('producto.idProducto', 'idProducto')
      .addSelect('producto.nombre', 'producto')
      .addSelect("COALESCE(categoria.nombre, 'Sin categoría')", 'categoria')
      .addSelect('SUM(detalle.cantidad)', 'unidadesVendidas')
      .addSelect('SUM(detalle.totalLinea)', 'ventas')
      .addSelect('SUM(detalle.costoTotal)', 'costo')
      .addSelect('SUM(detalle.gananciaBruta)', 'gananciaBruta')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .addGroupBy('categoria.nombre')
      .orderBy('SUM(detalle.totalLinea)', 'DESC')
      .addOrderBy('producto.idProducto', 'ASC');

    this.aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const filas = await query.getRawMany<{
      idProducto: string;
      producto: string;
      categoria: string;
      unidadesVendidas: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
    }>();

    return filas.map((fila) => {
      const ventas = Number(fila.ventas ?? 0);
      const ganancia = Number(fila.gananciaBruta ?? 0);

      return {
        idProducto: Number(fila.idProducto),
        producto: fila.producto,
        categoria: fila.categoria,
        unidadesVendidas: Number(fila.unidadesVendidas ?? 0),
        ventas: this.redondear(ventas),
        costo: this.redondear(Number(fila.costo ?? 0)),
        gananciaBruta: this.redondear(ganancia),
        margenBrutoPorcentaje:
          ventas > 0 ? this.redondear((ganancia / ventas) * 100) : 0,
      };
    });
  }

  async ventasPorLote(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesVentaRepository
      .createQueryBuilder('detalle')
      .innerJoin(VentaEntity, 'venta', 'venta.idVenta = detalle.idVenta')
      .innerJoin(LoteProducto, 'lote', 'lote.idLote = detalle.idLote')
      .innerJoin(
        Producto,
        'producto',
        'producto.idProducto = detalle.idProducto',
      )
      .select('lote.idLote', 'idLote')
      .addSelect('lote.codigoLote', 'codigoLote')
      .addSelect('producto.idProducto', 'idProducto')
      .addSelect('producto.nombre', 'producto')
      .addSelect('SUM(detalle.cantidad)', 'unidadesVendidas')
      .addSelect('SUM(detalle.totalLinea)', 'ventas')
      .addSelect('SUM(detalle.costoTotal)', 'costo')
      .addSelect('SUM(detalle.gananciaBruta)', 'gananciaBruta')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('lote.idLote')
      .addGroupBy('lote.codigoLote')
      .addGroupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .orderBy('SUM(detalle.gananciaBruta)', 'DESC')
      .addOrderBy('lote.idLote', 'ASC');

    this.aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const filas = await query.getRawMany<{
      idLote: string;
      codigoLote: string;
      idProducto: string;
      producto: string;
      unidadesVendidas: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
    }>();

    return filas.map((fila) => {
      const ventas = Number(fila.ventas ?? 0);
      const ganancia = Number(fila.gananciaBruta ?? 0);

      return {
        idLote: Number(fila.idLote),
        codigoLote: fila.codigoLote,
        idProducto: Number(fila.idProducto),
        producto: fila.producto,
        unidadesVendidas: Number(fila.unidadesVendidas ?? 0),
        ventas: this.redondear(ventas),
        costo: this.redondear(Number(fila.costo ?? 0)),
        gananciaBruta: this.redondear(ganancia),
        margenBrutoPorcentaje:
          ventas > 0 ? this.redondear((ganancia / ventas) * 100) : 0,
      };
    });
  }

  async ventasAnuladas(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(venta.totalVenta), 0)', 'importeOriginal')
      .addSelect('COALESCE(SUM(venta.costoTotal), 0)', 'costoOriginal')
      .addSelect('COALESCE(SUM(venta.gananciaBruta), 0)', 'gananciaOriginal')
      .addSelect('COALESCE(SUM(venta.montoPagado), 0)', 'montoPagadoHistorico')
      .where('venta.estadoVenta = :anulada', {
        anulada: 'ANULADA',
      });

    this.aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const raw = await query.getRawOne<{
      cantidad: string;
      importeOriginal: string;
      costoOriginal: string;
      gananciaOriginal: string;
      montoPagadoHistorico: string;
    }>();

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      cantidad: Number(raw?.cantidad ?? 0),
      importeOriginal: this.redondear(Number(raw?.importeOriginal ?? 0)),
      costoOriginal: this.redondear(Number(raw?.costoOriginal ?? 0)),
      gananciaOriginal: this.redondear(Number(raw?.gananciaOriginal ?? 0)),
      montoPagadoHistorico: this.redondear(
        Number(raw?.montoPagadoHistorico ?? 0),
      ),
    };
  }
}
