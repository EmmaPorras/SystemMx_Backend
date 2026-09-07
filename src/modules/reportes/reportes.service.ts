import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { PagoVenta } from '../../database/entities/pago-venta.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { Usuario } from '../../database/entities/usuario.entity';
import { VentaEntity } from '../../database/entities/venta.entity';

import { ConsultaAuditoriaMovimientosDto } from './dto/consulta-auditoria-movimientos.dto';
import { ConsultaAuditoriaDto } from './dto/consulta-auditoria.dto';
import { ConsultaInventarioHistoricoDto } from './dto/consulta-inventario-historico.dto';
import { ConsultaPeriodoDto } from './dto/consulta-periodo.dto';
import { ConsultaResumenDto } from './dto/consulta-resumen.dto';
import { ConsultaVencimientosDto } from './dto/consulta-vencimientos.dto';

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

    @InjectRepository(DetallePedidoCompra)
    private readonly detallesPedidoRepository: Repository<DetallePedidoCompra>,

    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,

    @InjectRepository(Categoria)
    private readonly categoriasRepository: Repository<Categoria>,

    @InjectRepository(OrigenCompra)
    private readonly proveedoresRepository: Repository<OrigenCompra>,

    @InjectRepository(MovimientoInventario)
    private readonly movimientosRepository: Repository<MovimientoInventario>,

    @InjectRepository(PagoVenta)
    private readonly pagosRepository: Repository<PagoVenta>,
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

  private aplicarPeriodoDatetime<T extends object>(
    query: SelectQueryBuilder<T>,
    campo: string,
    dto: ConsultaPeriodoDto,
  ): void {
    if (dto.fechaDesde) {
      query.andWhere(`${campo} >= :fechaDesdeDatetime`, {
        fechaDesdeDatetime: `${dto.fechaDesde}T00:00:00.000`,
      });
    }

    if (dto.fechaHasta) {
      const fechaHastaExclusiva = this.siguienteFechaIso(dto.fechaHasta);

      query.andWhere(`${campo} < :fechaHastaExclusiva`, {
        fechaHastaExclusiva: `${fechaHastaExclusiva}T00:00:00.000`,
      });
    }
  }

  private redondear(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private calcularPorcentaje(parte: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return this.redondear((parte / total) * 100);
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

  private siguienteFechaIso(fecha: string): string {
    const value = new Date(`${fecha}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + 1);
    return value.toISOString().slice(0, 10);
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

  async resumenInventario() {
    const raw = await this.lotesRepository
      .createQueryBuilder('lote')
      .select('COUNT(*)', 'totalLotes')
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.cantidadDisponible > 0
            THEN 1
            ELSE 0
          END
        )
        `,
        'lotesConStock',
      )
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadRecibida),
          0
        )
        `,
        'unidadesRecibidas',
      )
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadDisponible),
          0
        )
        `,
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
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.estadoLote = 'AGOTADO'
            THEN 1
            ELSE 0
          END
        )
        `,
        'agotados',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.estadoLote = 'EN_PROCESO'
            THEN 1
            ELSE 0
          END
        )
        `,
        'enProceso',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.estadoLote = 'EN_STOCK'
            THEN 1
            ELSE 0
          END
        )
        `,
        'enStock',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.estadoLote = 'VENDIDO_PARCIAL'
            THEN 1
            ELSE 0
          END
        )
        `,
        'vendidoParcial',
      )
      .getRawOne<{
        totalLotes: string;
        lotesConStock: string;
        unidadesRecibidas: string;
        unidadesDisponibles: string;
        valorCosto: string;
        agotados: string;
        enProceso: string;
        enStock: string;
        vendidoParcial: string;
      }>();

    return {
      totalLotes: Number(raw?.totalLotes ?? 0),
      lotesConStock: Number(raw?.lotesConStock ?? 0),
      unidadesRecibidas: Number(raw?.unidadesRecibidas ?? 0),
      unidadesDisponibles: Number(raw?.unidadesDisponibles ?? 0),
      valorCosto: this.redondear(Number(raw?.valorCosto ?? 0)),
      estados: {
        agotados: Number(raw?.agotados ?? 0),
        enProceso: Number(raw?.enProceso ?? 0),
        enStock: Number(raw?.enStock ?? 0),
        vendidoParcial: Number(raw?.vendidoParcial ?? 0),
      },
    };
  }

  async inventarioPorProducto() {
    const filas = await this.productosRepository
      .createQueryBuilder('producto')
      .leftJoin(LoteProducto, 'lote', 'lote.idProducto = producto.idProducto')
      .leftJoin(
        Categoria,
        'categoria',
        'categoria.idCategoria = producto.idCategoria',
      )
      .select('producto.idProducto', 'idProducto')
      .addSelect('producto.nombre', 'producto')
      .addSelect(
        `
        COALESCE(
          categoria.nombre,
          'Sin categoría'
        )
        `,
        'categoria',
      )
      .addSelect('COUNT(lote.idLote)', 'lotes')
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.cantidadDisponible > 0
            THEN 1
            ELSE 0
          END
        )
        `,
        'lotesConStock',
      )
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadRecibida),
          0
        )
        `,
        'cantidadRecibida',
      )
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadDisponible),
          0
        )
        `,
        'stockDisponible',
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
      .groupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .addGroupBy('categoria.nombre')
      .orderBy(
        `
        COALESCE(
          SUM(
            lote.cantidad_disponible *
            lote.costo_unitario_real
          ),
          0
        )
        `,
        'DESC',
      )
      .addOrderBy('producto.idProducto', 'ASC')
      .getRawMany<{
        idProducto: string | number;
        producto: string;
        categoria: string;
        lotes: string | number;
        lotesConStock: string | number;
        cantidadRecibida: string | number;
        stockDisponible: string | number;
        valorCosto: string | number;
      }>();

    return filas.map((fila) => ({
      idProducto: Number(fila.idProducto),
      producto: fila.producto,
      categoria: fila.categoria,
      lotes: Number(fila.lotes ?? 0),
      lotesConStock: Number(fila.lotesConStock ?? 0),
      cantidadRecibida: Number(fila.cantidadRecibida ?? 0),
      stockDisponible: Number(fila.stockDisponible ?? 0),
      valorCosto: this.redondear(Number(fila.valorCosto ?? 0)),
    }));
  }

  async inventarioPorEstado() {
    const filas = await this.lotesRepository
      .createQueryBuilder('lote')
      .select('lote.estadoLote', 'estado')
      .addSelect('COUNT(*)', 'lotes')
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadRecibida),
          0
        )
        `,
        'unidadesRecibidas',
      )
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadDisponible),
          0
        )
        `,
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
        'valorCostoDisponible',
      )
      .groupBy('lote.estadoLote')
      .orderBy('lote.estadoLote', 'ASC')
      .getRawMany<{
        estado: string;
        lotes: string | number;
        unidadesRecibidas: string | number;
        unidadesDisponibles: string | number;
        valorCostoDisponible: string | number;
      }>();

    return filas.map((fila) => ({
      estado: fila.estado,
      lotes: Number(fila.lotes ?? 0),
      unidadesRecibidas: Number(fila.unidadesRecibidas ?? 0),
      unidadesDisponibles: Number(fila.unidadesDisponibles ?? 0),
      valorCostoDisponible: this.redondear(
        Number(fila.valorCostoDisponible ?? 0),
      ),
    }));
  }

  async productosSinStock() {
    const filas = await this.productosRepository
      .createQueryBuilder('producto')
      .leftJoin(LoteProducto, 'lote', 'lote.idProducto = producto.idProducto')
      .select('producto.idProducto', 'idProducto')
      .addSelect('producto.nombre', 'producto')
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadRecibida),
          0
        )
        `,
        'cantidadRecibida',
      )
      .addSelect(
        `
        COALESCE(
          SUM(lote.cantidadDisponible),
          0
        )
        `,
        'stockDisponible',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.estadoLote = 'EN_PROCESO'
            THEN 1
            ELSE 0
          END
        )
        `,
        'lotesEnProceso',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN lote.estadoLote = 'AGOTADO'
            THEN 1
            ELSE 0
          END
        )
        `,
        'lotesAgotados',
      )
      .groupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .having(
        `
        COALESCE(
          SUM(lote.cantidadDisponible),
          0
        ) = 0
        `,
      )
      .orderBy('producto.nombre', 'ASC')
      .addOrderBy('producto.idProducto', 'ASC')
      .getRawMany<{
        idProducto: string | number;
        producto: string;
        cantidadRecibida: string | number;
        stockDisponible: string | number;
        lotesEnProceso: string | number;
        lotesAgotados: string | number;
      }>();

    return filas.map((fila) => ({
      idProducto: Number(fila.idProducto),
      producto: fila.producto,
      cantidadRecibida: Number(fila.cantidadRecibida ?? 0),
      stockDisponible: 0,
      lotesEnProceso: Number(fila.lotesEnProceso ?? 0),
      lotesAgotados: Number(fila.lotesAgotados ?? 0),
    }));
  }

  async historicoInventario(dto: ConsultaInventarioHistoricoDto) {
    this.validarFecha(dto.fechaCorte, 'fechaCorte');

    const fechaHastaExclusiva = this.siguienteFechaIso(dto.fechaCorte);

    const filas = await this.lotesRepository
      .createQueryBuilder('lote')
      .innerJoin(Producto, 'producto', 'producto.idProducto = lote.idProducto')
      .leftJoin(
        MovimientoInventario,
        'movimiento',
        'movimiento.idLote = lote.idLote',
      )
      .select('lote.idLote', 'idLote')
      .addSelect('lote.codigoLote', 'codigoLote')
      .addSelect('lote.idProducto', 'idProducto')
      .addSelect('producto.nombre', 'producto')
      .addSelect('lote.cantidadRecibida', 'cantidadRecibida')
      .addSelect('lote.cantidadDisponible', 'stockActual')
      .addSelect('lote.costoUnitarioReal', 'costoUnitarioReal')
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN movimiento.tipoMovimiento = :entrada
              THEN movimiento.cantidad
              ELSE 0
            END
          ),
          0
        )
        `,
        'entradasRegistradas',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN movimiento.fechaMovimiento < :fechaHastaExclusiva
              THEN
                CASE
                  WHEN movimiento.tipoMovimiento = :entrada
                  THEN movimiento.cantidad

                  WHEN movimiento.tipoMovimiento = :salida
                  THEN -movimiento.cantidad

                  WHEN movimiento.tipoMovimiento = :reingreso
                  THEN movimiento.cantidad

                  ELSE 0
                END
              ELSE 0
            END
          ),
          0
        )
        `,
        'stockLedgerAlCorte',
      )
      .setParameters({
        entrada: 'ENTRADA_COMPRA',
        salida: 'SALIDA_VENTA',
        reingreso: 'REINGRESO_ANULACION_VENTA',
        fechaHastaExclusiva,
      })
      .groupBy('lote.idLote')
      .addGroupBy('lote.codigoLote')
      .addGroupBy('lote.idProducto')
      .addGroupBy('producto.nombre')
      .addGroupBy('lote.cantidadRecibida')
      .addGroupBy('lote.cantidadDisponible')
      .addGroupBy('lote.costoUnitarioReal')
      .orderBy('lote.idLote', 'ASC')
      .getRawMany<{
        idLote: string | number;
        codigoLote: string;
        idProducto: string | number;
        producto: string;
        cantidadRecibida: string | number;
        stockActual: string | number;
        costoUnitarioReal: string | number;
        entradasRegistradas: string | number;
        stockLedgerAlCorte: string | number;
      }>();

    const lotes = filas.map((fila) => {
      const cantidadRecibida = Number(fila.cantidadRecibida ?? 0);
      const entradasRegistradas = Number(fila.entradasRegistradas ?? 0);
      const stockLedger = Number(fila.stockLedgerAlCorte ?? 0);
      const costoUnitarioReal = Number(fila.costoUnitarioReal ?? 0);

      const historialCompleto = entradasRegistradas === cantidadRecibida;
      const stockHistorico = historialCompleto ? stockLedger : null;
      const consistente =
        stockHistorico === null
          ? null
          : stockHistorico >= 0 && stockHistorico <= cantidadRecibida;

      return {
        idLote: Number(fila.idLote),
        codigoLote: fila.codigoLote,
        idProducto: Number(fila.idProducto),
        producto: fila.producto,
        cantidadRecibida,
        entradasRegistradas,
        historialCompleto,
        stockHistorico,
        stockActual: Number(fila.stockActual ?? 0),
        costoUnitarioReal: this.redondear(costoUnitarioReal),
        valorCostoHistorico:
          stockHistorico === null
            ? null
            : this.redondear(stockHistorico * costoUnitarioReal),
        consistente,
      };
    });

    const lotesCompletos = lotes.filter((lote) => lote.historialCompleto);
    const lotesLegacy = lotes.filter((lote) => !lote.historialCompleto);
    const lotesInconsistentes = lotesCompletos.filter(
      (lote) => lote.consistente === false,
    );

    return {
      fechaCorte: dto.fechaCorte,
      cobertura: {
        lotesTotales: lotes.length,
        lotesConHistorialCompleto: lotesCompletos.length,
        lotesLegacy: lotesLegacy.length,
        coberturaCompleta: lotesLegacy.length === 0,
        lotesInconsistentes: lotesInconsistentes.length,
      },
      reconstruccion: {
        unidades: lotesCompletos.reduce(
          (sum, lote) => sum + (lote.stockHistorico ?? 0),
          0,
        ),
        valorCosto: this.redondear(
          lotesCompletos.reduce(
            (sum, lote) => sum + (lote.valorCostoHistorico ?? 0),
            0,
          ),
        ),
      },
      lotes,
    };
  }

  async resumenCompras(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesPedidoRepository
      .createQueryBuilder('detalle')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = detalle.idPedido',
      )
      .select('COUNT(DISTINCT pedido.idPedido)', 'cantidadPedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.totalColones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envioAsignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestosAsignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otrosGastosAsignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costoTotalReal), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      });

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const recibidasQuery = this.lotesRepository
      .createQueryBuilder('lote')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = lote.idPedido',
      )
      .select('COALESCE(SUM(lote.cantidadRecibida), 0)', 'unidadesRecibidas')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      });

    this.aplicarPeriodo(recibidasQuery, 'pedido.fechaPedido', dto);

    const [raw, rawRecibidas] = await Promise.all([
      query.getRawOne<{
        cantidadPedidos: string;
        unidadesPedidas: string;
        mercaderiaColones: string;
        envio: string;
        impuestos: string;
        otrosGastos: string;
        costoReal: string;
      }>(),
      recibidasQuery.getRawOne<{
        unidadesRecibidas: string;
      }>(),
    ]);

    const unidadesPedidas = Number(raw?.unidadesPedidas ?? 0);
    const unidadesRecibidas = Number(rawRecibidas?.unidadesRecibidas ?? 0);
    const diferencia = unidadesPedidas - unidadesRecibidas;
    const unidadesPendientes = Math.max(diferencia, 0);
    const recepcionConsistente = diferencia >= 0;

    const mercaderiaColones = this.redondear(
      Number(raw?.mercaderiaColones ?? 0),
    );
    const envio = this.redondear(Number(raw?.envio ?? 0));
    const impuestos = this.redondear(Number(raw?.impuestos ?? 0));
    const otrosGastos = this.redondear(Number(raw?.otrosGastos ?? 0));
    const costoReal = this.redondear(Number(raw?.costoReal ?? 0));

    const componentes = this.redondear(
      mercaderiaColones + envio + impuestos + otrosGastos,
    );
    const diferenciaCosto = this.redondear(costoReal - componentes);
    const costoConsistente = Math.abs(costoReal - componentes) < 0.01;

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      cantidadPedidos: Number(raw?.cantidadPedidos ?? 0),
      unidadesPedidas,
      unidadesRecibidas,
      unidadesPendientes,
      recepcionConsistente,
      mercaderiaColones,
      envio,
      impuestos,
      otrosGastos,
      costoReal,
      diferenciaCosto,
      costoConsistente,
    };
  }

  async evolucionCompras(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesPedidoRepository
      .createQueryBuilder('detalle')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = detalle.idPedido',
      )
      .select('pedido.fechaPedido', 'fecha')
      .addSelect('COUNT(DISTINCT pedido.idPedido)', 'pedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.totalColones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envioAsignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestosAsignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otrosGastosAsignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costoTotalReal), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      })
      .groupBy('pedido.fechaPedido')
      .orderBy('pedido.fechaPedido', 'ASC');

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const filas = await query.getRawMany<{
      fecha: string | Date;
      pedidos: string;
      unidadesPedidas: string;
      mercaderiaColones: string;
      envio: string;
      impuestos: string;
      otrosGastos: string;
      costoReal: string;
    }>();

    return filas.map((fila) => ({
      fecha: this.formatearFecha(fila.fecha),
      pedidos: Number(fila.pedidos ?? 0),
      unidadesPedidas: Number(fila.unidadesPedidas ?? 0),
      mercaderiaColones: this.redondear(Number(fila.mercaderiaColones ?? 0)),
      envio: this.redondear(Number(fila.envio ?? 0)),
      impuestos: this.redondear(Number(fila.impuestos ?? 0)),
      otrosGastos: this.redondear(Number(fila.otrosGastos ?? 0)),
      costoReal: this.redondear(Number(fila.costoReal ?? 0)),
    }));
  }

  async comprasPorProveedor(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesPedidoRepository
      .createQueryBuilder('detalle')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = detalle.idPedido',
      )
      .leftJoin(
        OrigenCompra,
        'proveedor',
        'proveedor.idOrigenCompra = pedido.idOrigenCompra',
      )
      .select('proveedor.idOrigenCompra', 'idProveedor')
      .addSelect(
        "COALESCE(proveedor.nombreReferencia, 'Sin proveedor')",
        'proveedor',
      )
      .addSelect('COUNT(DISTINCT pedido.idPedido)', 'pedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.totalColones), 0)', 'mercaderiaColones')
      .addSelect(
        'COALESCE(SUM(detalle.envio_asignado + detalle.impuestos_asignados + detalle.otros_gastos_asignados), 0)',
        'costosAdicionales',
      )
      .addSelect('COALESCE(SUM(detalle.costoTotalReal), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      })
      .groupBy('proveedor.idOrigenCompra')
      .addGroupBy('proveedor.nombreReferencia')
      .orderBy('COALESCE(SUM(detalle.costoTotalReal), 0)', 'DESC')
      .addOrderBy('proveedor.idOrigenCompra', 'ASC');

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const filas = await query.getRawMany<{
      idProveedor: string | number;
      proveedor: string;
      pedidos: string;
      unidadesPedidas: string;
      mercaderiaColones: string;
      costosAdicionales: string;
      costoReal: string;
    }>();

    return filas.map((fila) => ({
      idProveedor: Number(fila.idProveedor),
      proveedor: fila.proveedor,
      pedidos: Number(fila.pedidos ?? 0),
      unidadesPedidas: Number(fila.unidadesPedidas ?? 0),
      mercaderiaColones: this.redondear(Number(fila.mercaderiaColones ?? 0)),
      costosAdicionales: this.redondear(Number(fila.costosAdicionales ?? 0)),
      costoReal: this.redondear(Number(fila.costoReal ?? 0)),
    }));
  }

  async comprasPorProducto(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesPedidoRepository
      .createQueryBuilder('detalle')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = detalle.idPedido',
      )
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
      .addSelect('COUNT(DISTINCT pedido.idPedido)', 'pedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.totalColones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envioAsignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestosAsignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otrosGastosAsignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costoTotalReal), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      })
      .groupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .addGroupBy('categoria.nombre')
      .orderBy('COALESCE(SUM(detalle.costoTotalReal), 0)', 'DESC')
      .addOrderBy('producto.idProducto', 'ASC');

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const filas = await query.getRawMany<{
      idProducto: string | number;
      producto: string;
      categoria: string;
      pedidos: string;
      unidadesPedidas: string;
      mercaderiaColones: string;
      envio: string;
      impuestos: string;
      otrosGastos: string;
      costoReal: string;
    }>();

    return filas.map((fila) => ({
      idProducto: Number(fila.idProducto),
      producto: fila.producto,
      categoria: fila.categoria,
      pedidos: Number(fila.pedidos ?? 0),
      unidadesPedidas: Number(fila.unidadesPedidas ?? 0),
      mercaderiaColones: this.redondear(Number(fila.mercaderiaColones ?? 0)),
      envio: this.redondear(Number(fila.envio ?? 0)),
      impuestos: this.redondear(Number(fila.impuestos ?? 0)),
      otrosGastos: this.redondear(Number(fila.otrosGastos ?? 0)),
      costoReal: this.redondear(Number(fila.costoReal ?? 0)),
    }));
  }

  async composicionCostosCompras(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesPedidoRepository
      .createQueryBuilder('detalle')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = detalle.idPedido',
      )
      .select('COALESCE(SUM(detalle.totalColones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envioAsignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestosAsignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otrosGastosAsignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costoTotalReal), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      });

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const raw = await query.getRawOne<{
      mercaderiaColones: string;
      envio: string;
      impuestos: string;
      otrosGastos: string;
      costoReal: string;
    }>();

    const mercaderia = this.redondear(Number(raw?.mercaderiaColones ?? 0));
    const envio = this.redondear(Number(raw?.envio ?? 0));
    const impuestos = this.redondear(Number(raw?.impuestos ?? 0));
    const otrosGastos = this.redondear(Number(raw?.otrosGastos ?? 0));
    const costoReal = this.redondear(Number(raw?.costoReal ?? 0));

    const mercaderiaPorcentaje =
      costoReal > 0 ? this.redondear((mercaderia / costoReal) * 100) : 0;
    const envioPorcentaje =
      costoReal > 0 ? this.redondear((envio / costoReal) * 100) : 0;
    const impuestosPorcentaje =
      costoReal > 0 ? this.redondear((impuestos / costoReal) * 100) : 0;
    const otrosGastosPorcentaje =
      costoReal > 0 ? this.redondear((otrosGastos / costoReal) * 100) : 0;

    const componentes = this.redondear(
      mercaderia + envio + impuestos + otrosGastos,
    );
    const diferencia = this.redondear(costoReal - componentes);
    const consistente = Math.abs(costoReal - componentes) < 0.01;

    return {
      mercaderia: {
        monto: mercaderia,
        porcentaje: mercaderiaPorcentaje,
      },
      envio: {
        monto: envio,
        porcentaje: envioPorcentaje,
      },
      impuestos: {
        monto: impuestos,
        porcentaje: impuestosPorcentaje,
      },
      otrosGastos: {
        monto: otrosGastos,
        porcentaje: otrosGastosPorcentaje,
      },
      costoReal,
      diferencia,
      consistente,
    };
  }

  async comprasCanceladas(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.detallesPedidoRepository
      .createQueryBuilder('detalle')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.idPedido = detalle.idPedido',
      )
      .select('COUNT(DISTINCT pedido.idPedido)', 'cantidadPedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPlaneadas')
      .addSelect('COALESCE(SUM(detalle.totalColones), 0)', 'mercaderiaOriginal')
      .addSelect(
        'COALESCE(SUM(detalle.costoTotalReal), 0)',
        'costoRealOriginal',
      )
      .where('pedido.estado = :cancelado', {
        cancelado: 'CANCELADO',
      });

    this.aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const raw = await query.getRawOne<{
      cantidadPedidos: string;
      unidadesPlaneadas: string;
      mercaderiaOriginal: string;
      costoRealOriginal: string;
    }>();

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      cantidadPedidos: Number(raw?.cantidadPedidos ?? 0),
      unidadesPlaneadas: Number(raw?.unidadesPlaneadas ?? 0),
      mercaderiaOriginal: this.redondear(Number(raw?.mercaderiaOriginal ?? 0)),
      costoRealOriginal: this.redondear(Number(raw?.costoRealOriginal ?? 0)),
    };
  }

  async resumenPagos(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.idVenta = pago.idVenta')
      .select('COUNT(*)', 'cantidadPagos')
      .addSelect('COUNT(DISTINCT pago.idVenta)', 'ventasConPago')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoRegistrado')
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estadoVenta <> :anulada
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
              WHEN venta.estadoVenta = :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasAnuladas',
      )
      .setParameter('anulada', 'ANULADA');

    this.aplicarPeriodoDatetime(query, 'pago.createdAt', dto);

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
      montoRegistrado: this.redondear(Number(raw?.montoRegistrado ?? 0)),
      montoVentasActivas: this.redondear(Number(raw?.montoVentasActivas ?? 0)),
      montoVentasAnuladas: this.redondear(
        Number(raw?.montoVentasAnuladas ?? 0),
      ),
    };
  }

  async pagosPorMetodo(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.idVenta = pago.idVenta')
      .select('pago.metodoPago', 'metodoPago')
      .addSelect('COUNT(*)', 'pagos')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoTotal')
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estadoVenta <> :anulada
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
              WHEN venta.estadoVenta = :anulada
              THEN pago.monto
              ELSE 0
            END
          ),
          0
        )`,
        'montoVentasAnuladas',
      )
      .setParameter('anulada', 'ANULADA')
      .groupBy('pago.metodoPago')
      .orderBy('SUM(pago.monto)', 'DESC')
      .addOrderBy('pago.metodoPago', 'ASC');

    this.aplicarPeriodoDatetime(query, 'pago.createdAt', dto);

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
      montoTotal: this.redondear(Number(fila.montoTotal ?? 0)),
      montoVentasActivas: this.redondear(Number(fila.montoVentasActivas ?? 0)),
      montoVentasAnuladas: this.redondear(
        Number(fila.montoVentasAnuladas ?? 0),
      ),
    }));
  }

  async evolucionPagos(dto: ConsultaPeriodoDto) {
    this.validarPeriodo(dto);

    const expresionFecha = 'CAST(pago.createdAt AS date)';

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.idVenta = pago.idVenta')
      .select(expresionFecha, 'fecha')
      .addSelect('COUNT(*)', 'pagos')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoTotal')
      .addSelect(
        `COALESCE(
          SUM(
            CASE
              WHEN venta.estadoVenta <> :anulada
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
              WHEN venta.estadoVenta = :anulada
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

    this.aplicarPeriodoDatetime(query, 'pago.createdAt', dto);

    const filas = await query.getRawMany<{
      fecha: unknown;
      pagos: string;
      montoTotal: string;
      montoVentasActivas: string;
      montoVentasAnuladas: string;
    }>();

    return filas.map((fila) => ({
      fecha: this.formatearFecha(fila.fecha),
      pagos: Number(fila.pagos ?? 0),
      montoTotal: this.redondear(Number(fila.montoTotal ?? 0)),
      montoVentasActivas: this.redondear(Number(fila.montoVentasActivas ?? 0)),
      montoVentasAnuladas: this.redondear(
        Number(fila.montoVentasAnuladas ?? 0),
      ),
    }));
  }

  async conciliacionPagos() {
    const filas = await this.ventasRepository
      .createQueryBuilder('venta')
      .leftJoin(PagoVenta, 'pago', 'pago.idVenta = venta.idVenta')
      .select('venta.idVenta', 'idVenta')
      .addSelect('venta.numeroVenta', 'numeroVenta')
      .addSelect('venta.fechaVenta', 'fechaVenta')
      .addSelect('venta.totalVenta', 'totalVenta')
      .addSelect('venta.montoPagado', 'montoPagadoVenta')
      .addSelect('venta.saldoPendiente', 'saldoPendiente')
      .addSelect('COUNT(pago.idPagoVenta)', 'cantidadPagosLedger')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoLedger')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('venta.idVenta')
      .addGroupBy('venta.numeroVenta')
      .addGroupBy('venta.fechaVenta')
      .addGroupBy('venta.totalVenta')
      .addGroupBy('venta.montoPagado')
      .addGroupBy('venta.saldoPendiente')
      .orderBy('venta.idVenta', 'ASC')
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
      const diferencia = this.redondear(montoPagadoVenta - montoLedger);

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
        fechaVenta: this.formatearFecha(fila.fechaVenta),
        totalVenta: this.redondear(Number(fila.totalVenta ?? 0)),
        montoPagadoVenta: this.redondear(montoPagadoVenta),
        saldoPendiente: this.redondear(Number(fila.saldoPendiente ?? 0)),
        cantidadPagosLedger: Number(fila.cantidadPagosLedger ?? 0),
        montoLedger: this.redondear(montoLedger),
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
        montoPagadoVenta: this.redondear(montoPagadoVenta),
        montoLedger: this.redondear(montoLedger),
        diferenciaCobertura: this.redondear(montoPagadoVenta - montoLedger),
      },
      detalle,
    };
  }

  async cuentasPorCobrar() {
    const ventas = await this.ventasRepository
      .createQueryBuilder('venta')
      .select('venta.idVenta', 'idVenta')
      .addSelect('venta.numeroVenta', 'numeroVenta')
      .addSelect('venta.fechaVenta', 'fechaVenta')
      .addSelect('venta.clienteNombre', 'clienteNombre')
      .addSelect('venta.estadoPago', 'estadoPago')
      .addSelect('venta.totalVenta', 'totalVenta')
      .addSelect('venta.montoPagado', 'montoPagado')
      .addSelect('venta.saldoPendiente', 'saldoPendiente')
      .addSelect('venta.fechaVencimientoPago', 'fechaVencimientoPago')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .andWhere('venta.saldoPendiente > 0')
      .orderBy(
        `CASE
          WHEN venta.fechaVencimientoPago IS NULL
          THEN 1
          ELSE 0
        END`,
        'ASC',
      )
      .addOrderBy('venta.fechaVencimientoPago', 'ASC')
      .addOrderBy('venta.fechaVenta', 'ASC')
      .addOrderBy('venta.idVenta', 'ASC')
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
      fechaVenta: this.formatearFecha(venta.fechaVenta),
      cliente: venta.clienteNombre?.trim() || 'Venta mostrador',
      estadoPago: venta.estadoPago,
      totalVenta: this.redondear(Number(venta.totalVenta ?? 0)),
      montoPagado: this.redondear(Number(venta.montoPagado ?? 0)),
      saldoPendiente: this.redondear(Number(venta.saldoPendiente ?? 0)),
      fechaVencimientoPago: venta.fechaVencimientoPago
        ? this.formatearFecha(venta.fechaVencimientoPago)
        : null,
    }));

    return {
      resumen: {
        ventasConSaldo: detalle.length,
        totalPorCobrar: this.redondear(
          detalle.reduce((sum, item) => sum + item.saldoPendiente, 0),
        ),
      },
      detalle,
    };
  }

  async vencimientosCuentasPorCobrar(dto: ConsultaVencimientosDto) {
    this.validarFecha(dto.fechaCorte, 'fechaCorte');

    const raw = await this.ventasRepository
      .createQueryBuilder('venta')
      .select(
        `SUM(
          CASE
            WHEN venta.fechaVencimientoPago IS NULL
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
              WHEN venta.fechaVencimientoPago IS NULL
              THEN venta.saldoPendiente
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
            WHEN venta.fechaVencimientoPago < :fechaCorte
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
              WHEN venta.fechaVencimientoPago < :fechaCorte
              THEN venta.saldoPendiente
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
            WHEN venta.fechaVencimientoPago = :fechaCorte
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
              WHEN venta.fechaVencimientoPago = :fechaCorte
              THEN venta.saldoPendiente
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
            WHEN venta.fechaVencimientoPago > :fechaCorte
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
              WHEN venta.fechaVencimientoPago > :fechaCorte
              THEN venta.saldoPendiente
              ELSE 0
            END
          ),
          0
        )`,
        'porVencerSaldo',
      )
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .andWhere('venta.saldoPendiente > 0')
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
        saldo: this.redondear(Number(raw?.sinVencimientoSaldo ?? 0)),
      },
      vencidas: {
        cantidad: Number(raw?.vencidasCantidad ?? 0),
        saldo: this.redondear(Number(raw?.vencidasSaldo ?? 0)),
      },
      venceEnFechaCorte: {
        cantidad: Number(raw?.venceHoyCantidad ?? 0),
        saldo: this.redondear(Number(raw?.venceHoySaldo ?? 0)),
      },
      porVencer: {
        cantidad: Number(raw?.porVencerCantidad ?? 0),
        saldo: this.redondear(Number(raw?.porVencerSaldo ?? 0)),
      },
    };
  }

  async resumenAuditoria() {
    const movimientos = await this.movimientosRepository
      .createQueryBuilder('movimiento')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(
          CASE
            WHEN movimiento.idUsuario IS NOT NULL
            THEN 1
            ELSE 0
          END
        )`,
        'auditados',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN movimiento.idUsuario IS NULL
            THEN 1
            ELSE 0
          END
        )`,
        'legacy',
      )
      .addSelect('COUNT(DISTINCT movimiento.idUsuario)', 'usuarios')
      .getRawOne<{
        total: string;
        auditados: string;
        legacy: string;
        usuarios: string;
      }>();

    const pagos = await this.pagosRepository
      .createQueryBuilder('pago')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(
          CASE
            WHEN pago.idUsuario IS NOT NULL
            THEN 1
            ELSE 0
          END
        )`,
        'auditados',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN pago.idUsuario IS NULL
            THEN 1
            ELSE 0
          END
        )`,
        'legacy',
      )
      .addSelect('COUNT(DISTINCT pago.idUsuario)', 'usuarios')
      .getRawOne<{
        total: string;
        auditados: string;
        legacy: string;
        usuarios: string;
      }>();

    const totalMovimientos = Number(movimientos?.total ?? 0);
    const movimientosAuditados = Number(movimientos?.auditados ?? 0);
    const movimientosLegacy = Number(movimientos?.legacy ?? 0);

    const totalPagos = Number(pagos?.total ?? 0);
    const pagosAuditados = Number(pagos?.auditados ?? 0);
    const pagosLegacy = Number(pagos?.legacy ?? 0);

    return {
      movimientos: {
        total: totalMovimientos,
        auditados: movimientosAuditados,
        legacy: movimientosLegacy,
        coberturaPorcentaje: this.calcularPorcentaje(
          movimientosAuditados,
          totalMovimientos,
        ),
        usuariosIdentificados: Number(movimientos?.usuarios ?? 0),
      },
      pagos: {
        total: totalPagos,
        auditados: pagosAuditados,
        legacy: pagosLegacy,
        coberturaPorcentaje: this.calcularPorcentaje(
          pagosAuditados,
          totalPagos,
        ),
        usuariosIdentificados: Number(pagos?.usuarios ?? 0),
      },
    };
  }

  async actividadPorUsuario(dto: ConsultaAuditoriaDto) {
    this.validarPeriodo(dto);

    const movimientosQuery = this.movimientosRepository
      .createQueryBuilder('movimiento')
      .innerJoin(Usuario, 'usuario', 'usuario.idUsuario = movimiento.idUsuario')
      .select('movimiento.idUsuario', 'idUsuario')
      .addSelect('usuario.username', 'username')
      .addSelect('usuario.nombre', 'nombre')
      .addSelect('usuario.rol', 'rol')
      .addSelect('COUNT(*)', 'movimientos')
      .addSelect(
        `SUM(
          CASE
            WHEN movimiento.tipoMovimiento = 'ENTRADA_COMPRA'
            THEN 1
            ELSE 0
          END
        )`,
        'entradas',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN movimiento.tipoMovimiento = 'SALIDA_VENTA'
            THEN 1
            ELSE 0
          END
        )`,
        'salidas',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN movimiento.tipoMovimiento = 'REINGRESO_ANULACION_VENTA'
            THEN 1
            ELSE 0
          END
        )`,
        'reingresos',
      )
      .addSelect('COALESCE(SUM(movimiento.cantidad), 0)', 'unidadesMovidas')
      .where('movimiento.idUsuario IS NOT NULL')
      .groupBy('movimiento.idUsuario')
      .addGroupBy('usuario.username')
      .addGroupBy('usuario.nombre')
      .addGroupBy('usuario.rol');

    this.aplicarPeriodoDatetime(
      movimientosQuery,
      'movimiento.fechaMovimiento',
      dto,
    );

    if (dto.usuarioId !== undefined) {
      movimientosQuery.andWhere('movimiento.idUsuario = :usuarioIdMovimiento', {
        usuarioIdMovimiento: dto.usuarioId,
      });
    }

    const pagosQuery = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(Usuario, 'usuario', 'usuario.idUsuario = pago.idUsuario')
      .select('pago.idUsuario', 'idUsuario')
      .addSelect('usuario.username', 'username')
      .addSelect('usuario.nombre', 'nombre')
      .addSelect('usuario.rol', 'rol')
      .addSelect('COUNT(*)', 'pagosProcesados')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoPagosProcesado')
      .where('pago.idUsuario IS NOT NULL')
      .groupBy('pago.idUsuario')
      .addGroupBy('usuario.username')
      .addGroupBy('usuario.nombre')
      .addGroupBy('usuario.rol');

    this.aplicarPeriodoDatetime(pagosQuery, 'pago.createdAt', dto);

    if (dto.usuarioId !== undefined) {
      pagosQuery.andWhere('pago.idUsuario = :usuarioIdPago', {
        usuarioIdPago: dto.usuarioId,
      });
    }

    const [movimientos, pagos] = await Promise.all([
      movimientosQuery.getRawMany<{
        idUsuario: string | number;
        username: string;
        nombre: string;
        rol: string;
        movimientos: string;
        entradas: string;
        salidas: string;
        reingresos: string;
        unidadesMovidas: string;
      }>(),
      pagosQuery.getRawMany<{
        idUsuario: string | number;
        username: string;
        nombre: string;
        rol: string;
        pagosProcesados: string;
        montoPagosProcesado: string;
      }>(),
    ]);

    const usuarios = new Map<
      number,
      {
        idUsuario: number;
        username: string;
        nombre: string;
        rol: string;
        movimientos: number;
        entradas: number;
        salidas: number;
        reingresos: number;
        unidadesMovidas: number;
        pagosProcesados: number;
        montoPagosProcesado: number;
      }
    >();

    for (const mov of movimientos) {
      const idUsuario = Number(mov.idUsuario);
      usuarios.set(idUsuario, {
        idUsuario,
        username: mov.username,
        nombre: mov.nombre,
        rol: mov.rol,
        movimientos: Number(mov.movimientos ?? 0),
        entradas: Number(mov.entradas ?? 0),
        salidas: Number(mov.salidas ?? 0),
        reingresos: Number(mov.reingresos ?? 0),
        unidadesMovidas: Number(mov.unidadesMovidas ?? 0),
        pagosProcesados: 0,
        montoPagosProcesado: 0,
      });
    }

    for (const p of pagos) {
      const idUsuario = Number(p.idUsuario);
      const existente = usuarios.get(idUsuario);

      if (existente) {
        existente.pagosProcesados = Number(p.pagosProcesados ?? 0);
        existente.montoPagosProcesado = this.redondear(
          Number(p.montoPagosProcesado ?? 0),
        );
      } else {
        usuarios.set(idUsuario, {
          idUsuario,
          username: p.username,
          nombre: p.nombre,
          rol: p.rol,
          movimientos: 0,
          entradas: 0,
          salidas: 0,
          reingresos: 0,
          unidadesMovidas: 0,
          pagosProcesados: Number(p.pagosProcesados ?? 0),
          montoPagosProcesado: this.redondear(
            Number(p.montoPagosProcesado ?? 0),
          ),
        });
      }
    }

    return Array.from(usuarios.values()).sort(
      (a, b) =>
        b.movimientos +
          b.pagosProcesados -
          (a.movimientos + a.pagosProcesados) || a.idUsuario - b.idUsuario,
    );
  }

  async movimientosAuditoria(dto: ConsultaAuditoriaMovimientosDto) {
    this.validarPeriodo(dto);

    const query = this.movimientosRepository
      .createQueryBuilder('movimiento')
      .leftJoin(Usuario, 'usuario', 'usuario.idUsuario = movimiento.idUsuario')
      .select('movimiento.idMovimiento', 'idMovimiento')
      .addSelect('movimiento.fechaMovimiento', 'fechaMovimiento')
      .addSelect('movimiento.tipoMovimiento', 'tipoMovimiento')
      .addSelect('movimiento.cantidad', 'cantidad')
      .addSelect('movimiento.idUsuario', 'idUsuario')
      .addSelect('usuario.username', 'usuarioActual')
      .addSelect('movimiento.usuario', 'usuarioSnapshot')
      .addSelect('movimiento.idProducto', 'idProducto')
      .addSelect('movimiento.idLote', 'idLote')
      .addSelect('movimiento.referenciaTipo', 'referenciaTipo')
      .addSelect('movimiento.referenciaId', 'referenciaId')
      .addSelect('movimiento.costoUnitario', 'costoUnitario')
      .addSelect('movimiento.totalMovimiento', 'totalMovimiento')
      .addSelect('movimiento.motivo', 'motivo')
      .addSelect('movimiento.observaciones', 'observaciones');

    this.aplicarPeriodoDatetime(query, 'movimiento.fechaMovimiento', dto);

    if (dto.usuarioId !== undefined) {
      query.andWhere('movimiento.idUsuario = :usuarioId', {
        usuarioId: dto.usuarioId,
      });
    }

    if (dto.tipoMovimiento) {
      query.andWhere('movimiento.tipoMovimiento = :tipoMovimiento', {
        tipoMovimiento: dto.tipoMovimiento,
      });
    }

    query
      .orderBy('movimiento.fechaMovimiento', 'DESC')
      .addOrderBy('movimiento.idMovimiento', 'DESC');

    const filas = await query.getRawMany<{
      idMovimiento: string | number;
      fechaMovimiento: unknown;
      tipoMovimiento: string;
      cantidad: string;
      idUsuario: string | number | null;
      usuarioActual: string | null;
      usuarioSnapshot: string | null;
      idProducto: string | number;
      idLote: string | number;
      referenciaTipo: string;
      referenciaId: string | number;
      costoUnitario: string;
      totalMovimiento: string;
      motivo: string;
      observaciones: string | null;
    }>();

    return filas.map((fila) => ({
      idMovimiento: Number(fila.idMovimiento),
      fechaMovimiento:
        fila.fechaMovimiento instanceof Date
          ? fila.fechaMovimiento.toISOString()
          : String(fila.fechaMovimiento),
      tipoMovimiento: fila.tipoMovimiento,
      cantidad: Number(fila.cantidad ?? 0),
      idUsuario: fila.idUsuario !== null ? Number(fila.idUsuario) : null,
      usuarioActual: fila.usuarioActual ?? null,
      usuarioSnapshot: fila.usuarioSnapshot ?? null,
      idProducto: Number(fila.idProducto),
      idLote: Number(fila.idLote),
      referenciaTipo: fila.referenciaTipo,
      referenciaId: Number(fila.referenciaId),
      costoUnitario: this.redondear(Number(fila.costoUnitario ?? 0)),
      totalMovimiento: this.redondear(Number(fila.totalMovimiento ?? 0)),
      motivo: fila.motivo,
      observaciones: fila.observaciones ?? null,
    }));
  }

  async pagosAuditoria(dto: ConsultaAuditoriaDto) {
    this.validarPeriodo(dto);

    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .innerJoin(VentaEntity, 'venta', 'venta.idVenta = pago.idVenta')
      .leftJoin(Usuario, 'usuario', 'usuario.idUsuario = pago.idUsuario')
      .select('pago.idPagoVenta', 'idPagoVenta')
      .addSelect('pago.createdAt', 'fecha')
      .addSelect('pago.idVenta', 'idVenta')
      .addSelect('venta.numeroVenta', 'numeroVenta')
      .addSelect('venta.estadoVenta', 'estadoVenta')
      .addSelect('pago.metodoPago', 'metodoPago')
      .addSelect('pago.monto', 'monto')
      .addSelect('pago.idUsuario', 'idUsuario')
      .addSelect('usuario.username', 'usuarioActual')
      .addSelect('pago.usuario', 'usuarioSnapshot')
      .addSelect('pago.referencia', 'referencia')
      .addSelect('pago.observaciones', 'observaciones');

    this.aplicarPeriodoDatetime(query, 'pago.createdAt', dto);

    if (dto.usuarioId !== undefined) {
      query.andWhere('pago.idUsuario = :usuarioId', {
        usuarioId: dto.usuarioId,
      });
    }

    query
      .orderBy('pago.createdAt', 'DESC')
      .addOrderBy('pago.idPagoVenta', 'DESC');

    const filas = await query.getRawMany<{
      idPagoVenta: string | number;
      fecha: unknown;
      idVenta: string | number;
      numeroVenta: string;
      estadoVenta: string;
      metodoPago: string;
      monto: string;
      idUsuario: string | number | null;
      usuarioActual: string | null;
      usuarioSnapshot: string | null;
      referencia: string | null;
      observaciones: string | null;
    }>();

    return filas.map((fila) => ({
      idPagoVenta: Number(fila.idPagoVenta),
      fecha:
        fila.fecha instanceof Date
          ? fila.fecha.toISOString()
          : String(fila.fecha),
      idVenta: Number(fila.idVenta),
      numeroVenta: fila.numeroVenta,
      estadoVenta: fila.estadoVenta,
      metodoPago: fila.metodoPago,
      monto: this.redondear(Number(fila.monto ?? 0)),
      idUsuario: fila.idUsuario !== null ? Number(fila.idUsuario) : null,
      usuarioActual: fila.usuarioActual ?? null,
      usuarioSnapshot: fila.usuarioSnapshot ?? null,
      referencia: fila.referencia ?? null,
      observaciones: fila.observaciones ?? null,
    }));
  }

  async legacyAuditoria() {
    const movimientos = await this.movimientosRepository
      .createQueryBuilder('movimiento')
      .select('movimiento.tipoMovimiento', 'tipo')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(movimiento.cantidad), 0)', 'unidades')
      .where('movimiento.idUsuario IS NULL')
      .groupBy('movimiento.tipoMovimiento')
      .orderBy('movimiento.tipoMovimiento', 'ASC')
      .getRawMany<{
        tipo: string;
        cantidad: string;
        unidades: string;
      }>();

    const pagos = await this.pagosRepository
      .createQueryBuilder('pago')
      .select('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'monto')
      .where('pago.idUsuario IS NULL')
      .getRawOne<{
        cantidad: string;
        monto: string;
      }>();

    return {
      movimientos: movimientos.map((fila) => ({
        tipoMovimiento: fila.tipo,
        cantidad: Number(fila.cantidad ?? 0),
        unidades: Number(fila.unidades ?? 0),
      })),
      pagos: {
        cantidad: Number(pagos?.cantidad ?? 0),
        monto: this.redondear(Number(pagos?.monto ?? 0)),
      },
    };
  }
}
