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
        'pedido.id_pedido = detalle.id_pedido',
      )
      .select('COUNT(DISTINCT pedido.id_pedido)', 'cantidadPedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.total_colones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envio_asignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestos_asignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otros_gastos_asignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costo_total_real), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      });

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

    const recibidasQuery = this.lotesRepository
      .createQueryBuilder('lote')
      .innerJoin(
        PedidoCompraEntity,
        'pedido',
        'pedido.id_pedido = lote.id_pedido',
      )
      .select('COALESCE(SUM(lote.cantidad_recibida), 0)', 'unidadesRecibidas')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      });

    aplicarPeriodo(recibidasQuery, 'pedido.fecha_pedido', dto);

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
        'pedido.id_pedido = detalle.id_pedido',
      )
      .select('pedido.fecha_pedido', 'fecha')
      .addSelect('COUNT(DISTINCT pedido.id_pedido)', 'pedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.total_colones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envio_asignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestos_asignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otros_gastos_asignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costo_total_real), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      })
      .groupBy('pedido.fecha_pedido')
      .orderBy('pedido.fecha_pedido', 'ASC');

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

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
        'pedido.id_pedido = detalle.id_pedido',
      )
      .leftJoin(
        OrigenCompra,
        'proveedor',
        'proveedor.id_origen_compra = pedido.id_origen_compra',
      )
      .select('proveedor.id_origen_compra', 'idProveedor')
      .addSelect(
        "COALESCE(proveedor.nombre_referencia, 'Sin proveedor')",
        'proveedor',
      )
      .addSelect('COUNT(DISTINCT pedido.id_pedido)', 'pedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.total_colones), 0)', 'mercaderiaColones')
      .addSelect(
        'COALESCE(SUM(detalle.envio_asignado + detalle.impuestos_asignados + detalle.otros_gastos_asignados), 0)',
        'costosAdicionales',
      )
      .addSelect('COALESCE(SUM(detalle.costo_total_real), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      })
      .groupBy('proveedor.id_origen_compra')
      .addGroupBy('proveedor.nombre_referencia')
      .orderBy('COALESCE(SUM(detalle.costo_total_real), 0)', 'DESC')
      .addOrderBy('proveedor.id_origen_compra', 'ASC');

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

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
        'pedido.id_pedido = detalle.id_pedido',
      )
      .innerJoin(
        Producto,
        'producto',
        'producto.id_producto = detalle.id_producto',
      )
      .leftJoin(
        Categoria,
        'categoria',
        'categoria.id_categoria = producto.id_categoria',
      )
      .select('producto.id_producto', 'idProducto')
      .addSelect('producto.nombre', 'producto')
      .addSelect("COALESCE(categoria.nombre, 'Sin categoría')", 'categoria')
      .addSelect('COUNT(DISTINCT pedido.id_pedido)', 'pedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPedidas')
      .addSelect('COALESCE(SUM(detalle.total_colones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envio_asignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestos_asignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otros_gastos_asignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costo_total_real), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      })
      .groupBy('producto.id_producto')
      .addGroupBy('producto.nombre')
      .addGroupBy('categoria.nombre')
      .orderBy('COALESCE(SUM(detalle.costo_total_real), 0)', 'DESC')
      .addOrderBy('producto.id_producto', 'ASC');

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

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
        'pedido.id_pedido = detalle.id_pedido',
      )
      .select('COALESCE(SUM(detalle.total_colones), 0)', 'mercaderiaColones')
      .addSelect('COALESCE(SUM(detalle.envio_asignado), 0)', 'envio')
      .addSelect('COALESCE(SUM(detalle.impuestos_asignados), 0)', 'impuestos')
      .addSelect(
        'COALESCE(SUM(detalle.otros_gastos_asignados), 0)',
        'otrosGastos',
      )
      .addSelect('COALESCE(SUM(detalle.costo_total_real), 0)', 'costoReal')
      .where('pedido.estado <> :cancelado', {
        cancelado: 'CANCELADO',
      });

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

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
        'pedido.id_pedido = detalle.id_pedido',
      )
      .select('COUNT(DISTINCT pedido.id_pedido)', 'cantidadPedidos')
      .addSelect('COALESCE(SUM(detalle.cantidad), 0)', 'unidadesPlaneadas')
      .addSelect(
        'COALESCE(SUM(detalle.total_colones), 0)',
        'mercaderiaOriginal',
      )
      .addSelect(
        'COALESCE(SUM(detalle.costo_total_real), 0)',
        'costoRealOriginal',
      )
      .where('pedido.estado = :cancelado', {
        cancelado: 'CANCELADO',
      });

    aplicarPeriodo(query, 'pedido.fecha_pedido', dto);

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
