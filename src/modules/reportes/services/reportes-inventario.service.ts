import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from '../../../database/entities/categoria.entity';
import { LoteProducto } from '../../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../../database/entities/movimiento-inventario.entity';
import { Producto } from '../../../database/entities/producto.entity';
import { ConsultaInventarioHistoricoDto } from '../dto/consulta-inventario-historico.dto';
import {
  redondear,
  siguienteFechaIso,
  validarFechaIso,
} from '../utils/reportes.utils';

@Injectable()
export class ReportesInventarioService {
  constructor(
    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,

    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,

    @InjectRepository(MovimientoInventario)
    private readonly movimientosRepository: Repository<MovimientoInventario>,
  ) {}

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
      valorCosto: redondear(Number(raw?.valorCosto ?? 0)),
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
      .orderBy('COALESCE(SUM(lote.cantidadDisponible), 0)', 'DESC')
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
      valorCosto: redondear(Number(fila.valorCosto ?? 0)),
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
      valorCostoDisponible: redondear(Number(fila.valorCostoDisponible ?? 0)),
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
    validarFechaIso(dto.fechaCorte, 'fechaCorte');

    const fechaHastaExclusiva = siguienteFechaIso(dto.fechaCorte);

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
        costoUnitarioReal: redondear(costoUnitarioReal),
        valorCostoHistorico:
          stockHistorico === null
            ? null
            : redondear(stockHistorico * costoUnitarioReal),
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
        valorCosto: redondear(
          lotesCompletos.reduce(
            (sum, lote) => sum + (lote.valorCostoHistorico ?? 0),
            0,
          ),
        ),
      },
      lotes,
    };
  }
}
