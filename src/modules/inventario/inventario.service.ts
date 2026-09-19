import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, In, Repository } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';

import { ConsultaLotesDto } from './dto/consulta-lotes.dto';
import { ConsultaMovimientosDto } from './dto/consulta-movimientos.dto';
import {
  RegistrarMovimientoInventarioInput,
  TipoMovimientoInventario,
} from './inventario.types';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,

    @InjectRepository(MovimientoInventario)
    private readonly movimientosRepository: Repository<MovimientoInventario>,

    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,

    @InjectRepository(PedidoCompraEntity)
    private readonly pedidosRepository: Repository<PedidoCompraEntity>,
  ) {}

  private obtenerReferenciaTipo(
    tipoMovimiento: TipoMovimientoInventario,
  ): 'PEDIDO' | 'VENTA' {
    switch (tipoMovimiento) {
      case 'ENTRADA_COMPRA':
        return 'PEDIDO';

      case 'SALIDA_VENTA':
      case 'REINGRESO_ANULACION_VENTA':
        return 'VENTA';
    }
  }

  private obtenerMotivoPredeterminado(
    tipoMovimiento: TipoMovimientoInventario,
  ): string {
    switch (tipoMovimiento) {
      case 'ENTRADA_COMPRA':
        return 'Recepción de mercancía por compra';

      case 'SALIDA_VENTA':
        return 'Salida de inventario por venta';

      case 'REINGRESO_ANULACION_VENTA':
        return 'Reingreso de inventario por anulación de venta';
    }
  }

  private normalizarTextoOpcional(
    value: string | null | undefined,
  ): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalizado = value.trim();

    return normalizado || null;
  }

  private mapearLote(
    lote: LoteProducto,
    producto?: Producto,
    pedido?: PedidoCompraEntity,
  ) {
    const cantidadInicial = Number(lote.cantidadInicial);
    const cantidadRecibida = Number(lote.cantidadRecibida);
    const cantidadDisponible = Number(lote.cantidadDisponible);

    const cantidadVendida = Math.max(0, cantidadRecibida - cantidadDisponible);

    const cantidadPendienteRecepcion = Math.max(
      0,
      cantidadInicial - cantidadRecibida,
    );

    return {
      idLote: lote.idLote,
      codigoLote: lote.codigoLote,

      idProducto: lote.idProducto,
      idPedido: lote.idPedido,
      idDetallePedido: lote.idDetallePedido ?? null,

      cantidadInicial,
      cantidadRecibida,
      cantidadDisponible,
      cantidadVendida,
      cantidadPendienteRecepcion,

      estadoLote: lote.estadoLote,
      fechaEntrada: lote.fechaEntrada ?? null,

      costoUnitarioReal: Number(lote.costoUnitarioReal),
      precioVentaRecomendado: Number(lote.precioVentaRecomendado),

      producto: producto
        ? {
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            activo: producto.activo,
          }
        : null,

      pedido: pedido
        ? {
            idPedido: pedido.idPedido,
            numeroPedido: pedido.numeroPedido,
            estado: pedido.estado,
          }
        : null,
    };
  }

  private mapearMovimiento(
    movimiento: MovimientoInventario,
    producto?: Producto,
    lote?: LoteProducto,
  ) {
    return {
      idMovimiento: movimiento.idMovimiento,
      fechaMovimiento: movimiento.fechaMovimiento,
      tipoMovimiento: movimiento.tipoMovimiento,
      cantidad: Number(movimiento.cantidad),
      referenciaTipo: movimiento.referenciaTipo,
      referenciaId: movimiento.referenciaId,
      idUsuario: movimiento.idUsuario ?? null,
      usuario: movimiento.usuario ?? null,
      motivo: movimiento.motivo,
      observaciones: movimiento.observaciones ?? null,
      costoUnitario: Number(movimiento.costoUnitario),
      totalMovimiento: Number(movimiento.totalMovimiento),

      producto: producto
        ? {
            idProducto: producto.idProducto,
            nombre: producto.nombre,
          }
        : null,

      lote: lote
        ? {
            idLote: lote.idLote,
            codigoLote: lote.codigoLote,
          }
        : null,
    };
  }

  async listarLotes(dto: ConsultaLotesDto) {
    const pagina = dto.pagina ?? 1;
    const limite = dto.limite ?? 50;

    const where: FindOptionsWhere<LoteProducto> = {};

    if (dto.productoId !== undefined) {
      where.idProducto = dto.productoId;
    }

    if (dto.pedidoId !== undefined) {
      where.idPedido = dto.pedidoId;
    }

    if (dto.estadoLote !== undefined) {
      where.estadoLote = dto.estadoLote;
    }

    const [lotes, total] = await this.lotesRepository.findAndCount({
      where,
      order: {
        idLote: 'DESC',
      },
      skip: (pagina - 1) * limite,
      take: limite,
    });

    const productoIds = [...new Set(lotes.map((lote) => lote.idProducto))];

    const pedidoIds = [...new Set(lotes.map((lote) => lote.idPedido))];

    const [productos, pedidos] = await Promise.all([
      productoIds.length > 0
        ? this.productosRepository.find({
            where: {
              idProducto: In(productoIds),
            },
          })
        : Promise.resolve([]),

      pedidoIds.length > 0
        ? this.pedidosRepository.find({
            where: {
              idPedido: In(pedidoIds),
            },
          })
        : Promise.resolve([]),
    ]);

    const productosPorId = new Map(
      productos.map((producto) => [producto.idProducto, producto]),
    );

    const pedidosPorId = new Map(
      pedidos.map((pedido) => [pedido.idPedido, pedido]),
    );

    return {
      items: lotes.map((lote) =>
        this.mapearLote(
          lote,
          productosPorId.get(lote.idProducto),
          pedidosPorId.get(lote.idPedido),
        ),
      ),
      total,
      pagina,
      limite,
      totalPaginas: total === 0 ? 0 : Math.ceil(total / limite),
    };
  }

  async buscarLotePorId(id: number) {
    const loteId = Number(id);

    if (!Number.isInteger(loteId) || loteId <= 0) {
      throw new BadRequestException('ID de lote inválido.');
    }

    const lote = await this.lotesRepository.findOne({
      where: {
        idLote: loteId,
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado.');
    }

    const [producto, pedido] = await Promise.all([
      this.productosRepository.findOne({
        where: {
          idProducto: lote.idProducto,
        },
      }),

      this.pedidosRepository.findOne({
        where: {
          idPedido: lote.idPedido,
        },
      }),
    ]);

    return this.mapearLote(lote, producto ?? undefined, pedido ?? undefined);
  }

  async listarLotesProducto(productoId: number, dto: ConsultaLotesDto) {
    const id = Number(productoId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('ID de producto inválido.');
    }

    const producto = await this.productosRepository.findOne({
      where: {
        idProducto: id,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return this.listarLotes({
      ...dto,
      productoId: id,
    });
  }

  async listarMovimientos(dto: ConsultaMovimientosDto) {
    const pagina = dto.pagina ?? 1;
    const limite = dto.limite ?? 50;

    if (
      dto.desde &&
      dto.hasta &&
      dto.desde.slice(0, 10) > dto.hasta.slice(0, 10)
    ) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a la fecha hasta.',
      );
    }

    const query = this.movimientosRepository.createQueryBuilder('movimiento');

    if (dto.productoId !== undefined) {
      query.andWhere('movimiento.idProducto = :productoId', {
        productoId: dto.productoId,
      });
    }

    if (dto.loteId !== undefined) {
      query.andWhere('movimiento.idLote = :loteId', {
        loteId: dto.loteId,
      });
    }

    if (dto.tipoMovimiento !== undefined) {
      query.andWhere('movimiento.tipoMovimiento = :tipoMovimiento', {
        tipoMovimiento: dto.tipoMovimiento,
      });
    }

    if (dto.referenciaTipo !== undefined) {
      query.andWhere('movimiento.referenciaTipo = :referenciaTipo', {
        referenciaTipo: dto.referenciaTipo,
      });
    }

    if (dto.referenciaId !== undefined) {
      query.andWhere('movimiento.referenciaId = :referenciaId', {
        referenciaId: dto.referenciaId,
      });
    }

    if (dto.usuarioId !== undefined) {
      query.andWhere('movimiento.idUsuario = :usuarioId', {
        usuarioId: dto.usuarioId,
      });
    }

    if (dto.desde) {
      query.andWhere('CONVERT(date, movimiento.fechaMovimiento) >= :desde', {
        desde: dto.desde.slice(0, 10),
      });
    }

    if (dto.hasta) {
      query.andWhere('CONVERT(date, movimiento.fechaMovimiento) <= :hasta', {
        hasta: dto.hasta.slice(0, 10),
      });
    }

    const [movimientos, total] = await query
      .orderBy('movimiento.fechaMovimiento', 'DESC')
      .addOrderBy('movimiento.idMovimiento', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();

    const productoIds = [
      ...new Set(movimientos.map((movimiento) => movimiento.idProducto)),
    ];

    const loteIds = [
      ...new Set(movimientos.map((movimiento) => movimiento.idLote)),
    ];

    const [productos, lotes] = await Promise.all([
      productoIds.length > 0
        ? this.productosRepository.find({
            where: {
              idProducto: In(productoIds),
            },
          })
        : Promise.resolve([]),

      loteIds.length > 0
        ? this.lotesRepository.find({
            where: {
              idLote: In(loteIds),
            },
          })
        : Promise.resolve([]),
    ]);

    const productosPorId = new Map(
      productos.map((producto) => [producto.idProducto, producto]),
    );

    const lotesPorId = new Map(lotes.map((lote) => [lote.idLote, lote]));

    return {
      items: movimientos.map((movimiento) =>
        this.mapearMovimiento(
          movimiento,
          productosPorId.get(movimiento.idProducto),
          lotesPorId.get(movimiento.idLote),
        ),
      ),
      total,
      pagina,
      limite,
      totalPaginas: total === 0 ? 0 : Math.ceil(total / limite),
    };
  }

  async buscarMovimientoPorId(id: number) {
    const movimientoId = Number(id);

    if (!Number.isInteger(movimientoId) || movimientoId <= 0) {
      throw new BadRequestException('ID de movimiento inválido.');
    }

    const movimiento = await this.movimientosRepository.findOne({
      where: {
        idMovimiento: movimientoId,
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento de inventario no encontrado.');
    }

    const [producto, lote] = await Promise.all([
      this.productosRepository.findOne({
        where: {
          idProducto: movimiento.idProducto,
        },
      }),

      this.lotesRepository.findOne({
        where: {
          idLote: movimiento.idLote,
        },
      }),
    ]);

    return this.mapearMovimiento(
      movimiento,
      producto ?? undefined,
      lote ?? undefined,
    );
  }

  async registrarMovimiento(
    manager: EntityManager,
    input: RegistrarMovimientoInventarioInput,
  ): Promise<MovimientoInventario> {
    const { lote, tipoMovimiento, cantidad, referenciaId } = input;

    if (!Number.isInteger(lote.idLote) || lote.idLote <= 0) {
      throw new BadRequestException(
        'ID de lote inválido para movimiento de inventario.',
      );
    }

    if (!Number.isInteger(lote.idProducto) || lote.idProducto <= 0) {
      throw new BadRequestException(
        'ID de producto inválido para movimiento de inventario.',
      );
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new BadRequestException(
        'La cantidad del movimiento debe ser un entero positivo.',
      );
    }

    if (!Number.isInteger(referenciaId) || referenciaId <= 0) {
      throw new BadRequestException(
        'La referencia del movimiento es inválida.',
      );
    }

    if (
      !input.actor ||
      !Number.isInteger(input.actor.idUsuario) ||
      input.actor.idUsuario <= 0
    ) {
      throw new ConflictException('El usuario de auditoría es inválido.');
    }

    const username = input.actor.username?.trim();

    if (!username) {
      throw new ConflictException('El usuario de auditoría es inválido.');
    }

    const costoUnitario = Number(lote.costoUnitarioReal);

    if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
      throw new ConflictException(
        `El lote ${lote.idLote} tiene un costo unitario inválido.`,
      );
    }

    const totalMovimiento = Number((costoUnitario * cantidad).toFixed(2));

    const movimientoRepository = manager.getRepository(MovimientoInventario);

    const movimiento = movimientoRepository.create({
      idProducto: lote.idProducto,
      idLote: lote.idLote,

      tipoMovimiento,
      cantidad,

      referenciaTipo: this.obtenerReferenciaTipo(tipoMovimiento),

      referenciaId,

      idUsuario: input.actor.idUsuario,
      usuario: username,

      motivo:
        this.normalizarTextoOpcional(input.motivo) ??
        this.obtenerMotivoPredeterminado(tipoMovimiento),

      observaciones: this.normalizarTextoOpcional(input.observaciones),

      costoUnitario,
      totalMovimiento,
    });

    return movimientoRepository.save(movimiento);
  }
}
