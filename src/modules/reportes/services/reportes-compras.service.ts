import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from '../../../database/entities/categoria.entity';
import { DetallePedidoCompra } from '../../../database/entities/detalle-pedido-compra.entity';
import { LoteProducto } from '../../../database/entities/lote-producto.entity';
import { OrigenCompra } from '../../../database/entities/origen-compra.entity';
import { PedidoCompraEntity } from '../../../database/entities/pedido-compra.entity';
import { Producto } from '../../../database/entities/producto.entity';
import { ConsultaPeriodoDto } from '../dto/consulta-periodo.dto';
import { aplicarPeriodo } from '../utils/reportes-query.utils';
import { redondear, validarPeriodo } from '../utils/reportes.utils';

@Injectable()
export class ReportesComprasService {
  constructor(
    @InjectRepository(DetallePedidoCompra)
    private readonly detallesPedidoRepository: Repository<DetallePedidoCompra>,

    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,
  ) {}

  async resumenCompras(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'pedido.fechaPedido', dto);

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

    aplicarPeriodo(recibidasQuery, 'pedido.fechaPedido', dto);

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

    const mercaderiaColones = redondear(Number(raw?.mercaderiaColones ?? 0));
    const envio = redondear(Number(raw?.envio ?? 0));
    const impuestos = redondear(Number(raw?.impuestos ?? 0));
    const otrosGastos = redondear(Number(raw?.otrosGastos ?? 0));
    const costoReal = redondear(Number(raw?.costoReal ?? 0));

    const componentes = redondear(
      mercaderiaColones + envio + impuestos + otrosGastos,
    );
    const diferenciaCosto = redondear(costoReal - componentes);
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
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const filas = await query.getRawMany<{
      fecha: string;
      pedidos: string;
      unidadesPedidas: string;
      mercaderiaColones: string;
      envio: string;
      impuestos: string;
      otrosGastos: string;
      costoReal: string;
    }>();

    return filas.map((fila) => ({
      fecha: fila.fecha,
      pedidos: Number(fila.pedidos ?? 0),
      unidadesPedidas: Number(fila.unidadesPedidas ?? 0),
      mercaderiaColones: redondear(Number(fila.mercaderiaColones ?? 0)),
      envio: redondear(Number(fila.envio ?? 0)),
      impuestos: redondear(Number(fila.impuestos ?? 0)),
      otrosGastos: redondear(Number(fila.otrosGastos ?? 0)),
      costoReal: redondear(Number(fila.costoReal ?? 0)),
    }));
  }

  async comprasPorProveedor(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'pedido.fechaPedido', dto);

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
      mercaderiaColones: redondear(Number(fila.mercaderiaColones ?? 0)),
      costosAdicionales: redondear(Number(fila.costosAdicionales ?? 0)),
      costoReal: redondear(Number(fila.costoReal ?? 0)),
    }));
  }

  async comprasPorProducto(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'pedido.fechaPedido', dto);

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
      mercaderiaColones: redondear(Number(fila.mercaderiaColones ?? 0)),
      envio: redondear(Number(fila.envio ?? 0)),
      impuestos: redondear(Number(fila.impuestos ?? 0)),
      otrosGastos: redondear(Number(fila.otrosGastos ?? 0)),
      costoReal: redondear(Number(fila.costoReal ?? 0)),
    }));
  }

  async composicionCostosCompras(dto: ConsultaPeriodoDto) {
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'pedido.fechaPedido', dto);

    const raw = await query.getRawOne<{
      mercaderiaColones: string;
      envio: string;
      impuestos: string;
      otrosGastos: string;
      costoReal: string;
    }>();

    const mercaderia = redondear(Number(raw?.mercaderiaColones ?? 0));
    const envio = redondear(Number(raw?.envio ?? 0));
    const impuestos = redondear(Number(raw?.impuestos ?? 0));
    const otrosGastos = redondear(Number(raw?.otrosGastos ?? 0));
    const costoReal = redondear(Number(raw?.costoReal ?? 0));

    const mercaderiaPorcentaje =
      costoReal > 0 ? redondear((mercaderia / costoReal) * 100) : 0;
    const envioPorcentaje =
      costoReal > 0 ? redondear((envio / costoReal) * 100) : 0;
    const impuestosPorcentaje =
      costoReal > 0 ? redondear((impuestos / costoReal) * 100) : 0;
    const otrosGastosPorcentaje =
      costoReal > 0 ? redondear((otrosGastos / costoReal) * 100) : 0;

    const componentes = redondear(mercaderia + envio + impuestos + otrosGastos);
    const diferencia = redondear(costoReal - componentes);
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
    validarPeriodo(dto);

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

    aplicarPeriodo(query, 'pedido.fechaPedido', dto);

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
      mercaderiaOriginal: redondear(Number(raw?.mercaderiaOriginal ?? 0)),
      costoRealOriginal: redondear(Number(raw?.costoRealOriginal ?? 0)),
    };
  }
}
