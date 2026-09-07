import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MovimientoInventario } from '../../../database/entities/movimiento-inventario.entity';
import { PagoVenta } from '../../../database/entities/pago-venta.entity';
import { Usuario } from '../../../database/entities/usuario.entity';
import { VentaEntity } from '../../../database/entities/venta.entity';
import { ConsultaAuditoriaMovimientosDto } from '../dto/consulta-auditoria-movimientos.dto';
import { ConsultaAuditoriaDto } from '../dto/consulta-auditoria.dto';
import { aplicarPeriodoDatetime } from '../utils/reportes-query.utils';
import {
  calcularPorcentaje,
  redondear,
  validarPeriodo,
} from '../utils/reportes.utils';

@Injectable()
export class ReportesAuditoriaService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientosRepository: Repository<MovimientoInventario>,

    @InjectRepository(PagoVenta)
    private readonly pagosRepository: Repository<PagoVenta>,
  ) {}

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
        coberturaPorcentaje: calcularPorcentaje(
          movimientosAuditados,
          totalMovimientos,
        ),
        usuariosIdentificados: Number(movimientos?.usuarios ?? 0),
      },
      pagos: {
        total: totalPagos,
        auditados: pagosAuditados,
        legacy: pagosLegacy,
        coberturaPorcentaje: calcularPorcentaje(pagosAuditados, totalPagos),
        usuariosIdentificados: Number(pagos?.usuarios ?? 0),
      },
    };
  }

  async actividadPorUsuario(dto: ConsultaAuditoriaDto) {
    validarPeriodo(dto);

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

    aplicarPeriodoDatetime(movimientosQuery, 'movimiento.fechaMovimiento', dto);

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

    aplicarPeriodoDatetime(pagosQuery, 'pago.createdAt', dto);

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
        existente.montoPagosProcesado = redondear(
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
          montoPagosProcesado: redondear(Number(p.montoPagosProcesado ?? 0)),
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
    validarPeriodo(dto);

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

    aplicarPeriodoDatetime(query, 'movimiento.fechaMovimiento', dto);

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
      costoUnitario: redondear(Number(fila.costoUnitario ?? 0)),
      totalMovimiento: redondear(Number(fila.totalMovimiento ?? 0)),
      motivo: fila.motivo,
      observaciones: fila.observaciones ?? null,
    }));
  }

  async pagosAuditoria(dto: ConsultaAuditoriaDto) {
    validarPeriodo(dto);

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

    aplicarPeriodoDatetime(query, 'pago.createdAt', dto);

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
      monto: redondear(Number(fila.monto ?? 0)),
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
        monto: redondear(Number(pagos?.monto ?? 0)),
      },
    };
  }
}
