import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from '../../../database/entities/categoria.entity';
import { DetalleVenta } from '../../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../../database/entities/lote-producto.entity';
import { Producto } from '../../../database/entities/producto.entity';
import { VentaEntity } from '../../../database/entities/venta.entity';
import { ConsultaPeriodoDto } from '../dto/consulta-periodo.dto';
import { aplicarPeriodo } from '../utils/reportes-query.utils';
import {
  formatearFecha,
  redondear,
  validarPeriodo,
} from '../utils/reportes.utils';

@Injectable()
export class ReportesVentasService {
  constructor(
    @InjectRepository(VentaEntity)
    private readonly ventasRepository: Repository<VentaEntity>,

    @InjectRepository(DetalleVenta)
    private readonly detallesVentaRepository: Repository<DetalleVenta>,
  ) {}

  async resumenVentas(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .select('COUNT(*)', 'cantidadVentas')
      .addSelect('COALESCE(SUM(venta.subtotal), 0)', 'subtotal')
      .addSelect('COALESCE(SUM(venta.descuentoTotal), 0)', 'descuentos')
      .addSelect('COALESCE(SUM(venta.impuestoTotal), 0)', 'iva')
      .addSelect('COALESCE(SUM(venta.totalVenta), 0)', 'ventas')
      .addSelect('COALESCE(SUM(venta.costoTotal), 0)', 'costo')
      .addSelect('COALESCE(SUM(venta.gananciaBruta), 0)', 'gananciaBruta')
      .addSelect('COALESCE(SUM(venta.montoPagado), 0)', 'montoPagado')
      .addSelect('COALESCE(SUM(venta.saldoPendiente), 0)', 'saldoPendiente')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      });

    aplicarPeriodo(query, 'venta.fechaVenta', dto);

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
    const costo = Number(raw?.costo ?? 0);
    const gananciaBruta = Number(raw?.gananciaBruta ?? 0);

    const margenBrutoPorcentaje =
      ventas > 0 ? (gananciaBruta / ventas) * 100 : 0;

    return {
      periodo: {
        fechaDesde: dto.fechaDesde ?? null,
        fechaHasta: dto.fechaHasta ?? null,
      },
      cantidadVentas: Number(raw?.cantidadVentas ?? 0),
      subtotal: redondear(Number(raw?.subtotal ?? 0)),
      descuentos: redondear(Number(raw?.descuentos ?? 0)),
      iva: redondear(Number(raw?.iva ?? 0)),
      ventas: redondear(ventas),
      costo: redondear(costo),
      gananciaBruta: redondear(gananciaBruta),
      margenBrutoPorcentaje: redondear(margenBrutoPorcentaje),
      montoPagado: redondear(Number(raw?.montoPagado ?? 0)),
      saldoPendiente: redondear(Number(raw?.saldoPendiente ?? 0)),
    };
  }

  async evolucionVentas(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const filas = await query.getRawMany<{
      fecha: unknown;
      cantidadVentas: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
    }>();

    return filas.map((fila) => {
      const ventas = Number(fila.ventas ?? 0);
      const gananciaBruta = Number(fila.gananciaBruta ?? 0);
      const margenBrutoPorcentaje =
        ventas > 0 ? (gananciaBruta / ventas) * 100 : 0;

      return {
        fecha: formatearFecha(fila.fecha),
        cantidadVentas: Number(fila.cantidadVentas ?? 0),
        ventas: redondear(ventas),
        costo: redondear(Number(fila.costo ?? 0)),
        gananciaBruta: redondear(gananciaBruta),
        margenBrutoPorcentaje: redondear(margenBrutoPorcentaje),
      };
    });
  }

  async ventasPorProducto(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesVendidas')
      .addSelect('COALESCE(SUM(detalle.totalDetalle), 0)', 'ventas')
      .addSelect('COALESCE(SUM(detalle.costoTotal), 0)', 'costo')
      .addSelect('COALESCE(SUM(detalle.gananciaBruta), 0)', 'gananciaBruta')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .addGroupBy('categoria.nombre')
      .orderBy('SUM(detalle.totalDetalle)', 'DESC')
      .addOrderBy('producto.idProducto', 'ASC');

    aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const filas = await query.getRawMany<{
      idProducto: string | number;
      producto: string;
      categoria: string;
      unidadesVendidas: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
    }>();

    return filas.map((fila) => {
      const ventas = Number(fila.ventas ?? 0);
      const gananciaBruta = Number(fila.gananciaBruta ?? 0);
      const margenBrutoPorcentaje =
        ventas > 0 ? (gananciaBruta / ventas) * 100 : 0;

      return {
        idProducto: Number(fila.idProducto),
        producto: fila.producto,
        categoria: fila.categoria,
        unidadesVendidas: Number(fila.unidadesVendidas ?? 0),
        ventas: redondear(ventas),
        costo: redondear(Number(fila.costo ?? 0)),
        gananciaBruta: redondear(gananciaBruta),
        margenBrutoPorcentaje: redondear(margenBrutoPorcentaje),
      };
    });
  }

  async ventasPorLote(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesVendidas')
      .addSelect('COALESCE(SUM(detalle.totalDetalle), 0)', 'ventas')
      .addSelect('COALESCE(SUM(detalle.costoTotal), 0)', 'costo')
      .addSelect('COALESCE(SUM(detalle.gananciaBruta), 0)', 'gananciaBruta')
      .where('venta.estadoVenta <> :anulada', {
        anulada: 'ANULADA',
      })
      .groupBy('lote.idLote')
      .addGroupBy('lote.codigoLote')
      .addGroupBy('producto.idProducto')
      .addGroupBy('producto.nombre')
      .orderBy('SUM(detalle.totalDetalle)', 'DESC')
      .addOrderBy('lote.idLote', 'ASC');

    aplicarPeriodo(query, 'venta.fechaVenta', dto);

    const filas = await query.getRawMany<{
      idLote: string | number;
      codigoLote: string;
      idProducto: string | number;
      producto: string;
      unidadesVendidas: string;
      ventas: string;
      costo: string;
      gananciaBruta: string;
    }>();

    return filas.map((fila) => {
      const ventas = Number(fila.ventas ?? 0);
      const gananciaBruta = Number(fila.gananciaBruta ?? 0);
      const margenBrutoPorcentaje =
        ventas > 0 ? (gananciaBruta / ventas) * 100 : 0;

      return {
        idLote: Number(fila.idLote),
        codigoLote: fila.codigoLote,
        idProducto: Number(fila.idProducto),
        producto: fila.producto,
        unidadesVendidas: Number(fila.unidadesVendidas ?? 0),
        ventas: redondear(ventas),
        costo: redondear(Number(fila.costo ?? 0)),
        gananciaBruta: redondear(gananciaBruta),
        margenBrutoPorcentaje: redondear(margenBrutoPorcentaje),
      };
    });
  }

  async ventasAnuladas(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'venta.fechaVenta', dto);

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
      importeOriginal: redondear(Number(raw?.importeOriginal ?? 0)),
      costoOriginal: redondear(Number(raw?.costoOriginal ?? 0)),
      gananciaOriginal: redondear(Number(raw?.gananciaOriginal ?? 0)),
      montoPagadoHistorico: redondear(Number(raw?.montoPagadoHistorico ?? 0)),
    };
  }
}
