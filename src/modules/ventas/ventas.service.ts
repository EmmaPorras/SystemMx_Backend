import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, MoreThan, Repository } from 'typeorm';

import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { PagoVenta } from '../../database/entities/pago-venta.entity';
import { VentaEntity } from '../../database/entities/venta.entity';
import { ActorAuditoria } from '../auth/auth.types';
import { InventarioService } from '../inventario/inventario.service';
import { CreateVentaDetalleDto, CreateVentaDto } from './dto/create-venta.dto';
import { RegistrarPagoVentaDto } from './dto/registrar-pago-venta.dto';

type FindAllVentasFilters = {
  papelera?: string;
  deudores?: string;
};

type TarifaCalculada = {
  idTarifaIva: number | null;
  porcentajeIva: number;
};

type LoteAsignado = {
  lote: LoteProducto;
  cantidad: number;
  costoUnitarioReal: number;
};

type DetalleVentaCalculado = {
  lote: LoteProducto;
  idProducto: number;
  idLote: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento: number;
  baseImponible: number;
  tipoTarifa: string;
  idTarifaIva: number | null;
  porcentajeIva: number;
  iva: number;
  totalLinea: number;
  costoUnitarioReal: number;
  costoTotal: number;
  gananciaBruta: number;
  modoDescuentoLote: string;
  detalle: string | null;
};

@Injectable()
export class VentasService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(VentaEntity)
    private readonly ventasRepository: Repository<VentaEntity>,

    @InjectRepository(PagoVenta)
    private readonly pagosRepository: Repository<PagoVenta>,

    private readonly inventarioService: InventarioService,
  ) {}

  async findAll(filters: FindAllVentasFilters = {}) {
    const mostrarPapelera = filters.papelera === 'true';
    const mostrarDeudores = filters.deudores === 'true';

    const query = this.ventasRepository
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.detalles', 'detalle')
      .leftJoinAndSelect('detalle.producto', 'producto')
      .leftJoinAndSelect('detalle.lote', 'lote')
      .where('venta.en_papelera = :enPapelera', {
        enPapelera: mostrarPapelera ? 1 : 0,
      });

    if (mostrarDeudores) {
      query
        .andWhere('venta.estado_pago IN (:...estadosPago)', {
          estadosPago: ['EN_DEUDA', 'PARCIAL'],
        })
        .andWhere('venta.estado_venta = :estadoVenta', {
          estadoVenta: 'REGISTRADA',
        });
    }

    query
      .orderBy('venta.fecha_venta', 'DESC')
      .addOrderBy('venta.id_venta', 'DESC')
      .addOrderBy('detalle.id_detalle_venta', 'ASC');

    const ventas = await query.getMany();

    return ventas.map((venta) => this.mapVentaToResponse(venta));
  }

  async findOne(id: number) {
    const ventaId = this.validarId(id, 'ID de venta inválido.');

    const venta = await this.ventasRepository.findOne({
      where: {
        idVenta: ventaId,
      },
      relations: {
        detalles: {
          producto: true,
          lote: true,
        },
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada.');
    }

    return this.mapVentaToResponse(venta);
  }

  async obtenerInventarioDisponible() {
    const lotes = await this.dataSource.getRepository(LoteProducto).find({
      where: {
        cantidadDisponible: MoreThan(0),
        estadoLote: In(['EN_STOCK', 'VENDIDO_PARCIAL']),
      },
      relations: {
        producto: true,
        pedido: {
          origenCompra: true,
        },
      },
      order: {
        fechaEntrada: 'ASC',
        idLote: 'ASC',
      },
    });

    return lotes.map((lote) => ({
      loteId: lote.idLote,
      productoId: lote.idProducto,
      productoNombre: lote.producto?.nombre ?? `Producto ${lote.idProducto}`,
      loteCodigo: lote.codigoLote,
      pedidoId: lote.idPedido,
      numeroPedido: lote.pedido?.numeroPedido
        ? String(lote.pedido.numeroPedido)
        : '',
      proveedorNombre:
        lote.pedido?.origenCompra?.nombreReferencia ??
        `Proveedor ${lote.pedido?.idOrigenCompra ?? ''}`.trim(),
      cantidadDisponible: Number(lote.cantidadDisponible),
      costoUnitarioReal: Number(lote.costoUnitarioReal),
      precioVentaRecomendado: Number(lote.precioVentaRecomendado),
      estadoLote: lote.estadoLote,
      fechaEntrada: lote.fechaEntrada,
    }));
  }

  async create(dto: CreateVentaDto, actor: ActorAuditoria) {
    await this.validarNumeroVentaDisponible(dto.numeroVenta);

    let ventaIdCreada = 0;

    await this.dataSource.transaction(async (manager) => {
      const detallesCalculados: DetalleVentaCalculado[] = [];

      for (const detalleDto of dto.detalles) {
        const detallesPorLinea = await this.calcularDetallesPorLinea(
          manager,
          detalleDto,
        );

        detallesCalculados.push(...detallesPorLinea);
      }

      const totales = this.calcularTotalesVenta(detallesCalculados);
      const montoPagado =
        dto.montoPagado === undefined || dto.montoPagado === null
          ? totales.totalVenta
          : this.redondear(dto.montoPagado);

      if (montoPagado > totales.totalVenta) {
        throw new BadRequestException(
          'El monto pagado no puede ser mayor al total de la venta.',
        );
      }

      const saldoPendiente = this.redondear(totales.totalVenta - montoPagado);
      const estadoPago = this.calcularEstadoPago(
        totales.totalVenta,
        montoPagado,
      );

      const venta = manager.create(VentaEntity, {
        numeroVenta: dto.numeroVenta,
        fechaVenta: dto.fechaVenta,
        clienteNombre: dto.clienteNombre?.trim() || null,
        medioPago: dto.medioPago,
        estadoPago,
        estadoVenta: 'REGISTRADA',
        subtotal: totales.subtotal,
        descuentoTotal: totales.descuentoTotal,
        ivaTotal: totales.ivaTotal,
        totalVenta: totales.totalVenta,
        montoPagado,
        saldoPendiente,
        costoTotal: totales.costoTotal,
        gananciaBruta: totales.gananciaBruta,
        margenBruto: totales.margenBruto,
        fechaEntrega: dto.fechaEntrega ?? dto.fechaVenta,
        fechaVencimientoPago: dto.fechaVencimientoPago ?? null,
        observaciones: dto.observaciones?.trim() || null,
        enPapelera: dto.enPapelera ?? false,
      });

      const ventaGuardada = await manager.save(VentaEntity, venta);
      ventaIdCreada = ventaGuardada.idVenta;

      for (const detalleCalculado of detallesCalculados) {
        const detalle = manager.create(DetalleVenta, {
          idVenta: ventaGuardada.idVenta,
          idProducto: detalleCalculado.idProducto,
          idLote: detalleCalculado.idLote,
          cantidad: detalleCalculado.cantidad,
          precioUnitario: detalleCalculado.precioUnitario,
          subtotal: detalleCalculado.subtotal,
          descuento: detalleCalculado.descuento,
          baseImponible: detalleCalculado.baseImponible,
          tipoTarifa: detalleCalculado.tipoTarifa,
          idTarifaIva: detalleCalculado.idTarifaIva,
          porcentajeIva: detalleCalculado.porcentajeIva,
          iva: detalleCalculado.iva,
          totalLinea: detalleCalculado.totalLinea,
          costoUnitarioReal: detalleCalculado.costoUnitarioReal,
          costoTotal: detalleCalculado.costoTotal,
          gananciaBruta: detalleCalculado.gananciaBruta,
          modoDescuentoLote: detalleCalculado.modoDescuentoLote,
          detalle: detalleCalculado.detalle,
        });

        await manager.save(DetalleVenta, detalle);

        await this.inventarioService.registrarMovimiento(manager, {
          lote: detalleCalculado.lote,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: detalleCalculado.cantidad,
          referenciaId: ventaGuardada.idVenta,
          actor,
        });
      }

      if (montoPagado > 0) {
        await this.crearRegistroPago(manager, ventaGuardada, actor, {
          monto: montoPagado,
          metodoPago: dto.medioPago,
        });
      }
    });

    return this.findOne(ventaIdCreada);
  }

  async registrarPago(
    id: number,
    dto: RegistrarPagoVentaDto,
    actor: ActorAuditoria,
  ) {
    const ventaId = this.validarId(id, 'ID de venta inválido.');

    await this.dataSource.transaction(async (manager) => {
      const ventaRepository = manager.getRepository(VentaEntity);

      /*
       * Bloqueo imprescindible:
       * dos pagos simultáneos no pueden
       * consumir el mismo saldo.
       */
      const venta = await ventaRepository
        .createQueryBuilder('venta')
        .setLock('pessimistic_write')
        .where('venta.id_venta = :ventaId', {
          ventaId,
        })
        .getOne();

      if (!venta) {
        throw new NotFoundException('Venta no encontrada.');
      }

      if (venta.estadoVenta === 'ANULADA') {
        throw new ConflictException(
          'No se pueden registrar pagos en una venta anulada.',
        );
      }

      const totalVenta = Number(venta.totalVenta);
      const montoAnterior = Number(venta.montoPagado);
      const saldoActual = Number(venta.saldoPendiente);

      if (
        !Number.isFinite(totalVenta) ||
        !Number.isFinite(montoAnterior) ||
        !Number.isFinite(saldoActual) ||
        totalVenta < 0 ||
        montoAnterior < 0 ||
        saldoActual < 0
      ) {
        throw new ConflictException(
          'La venta contiene importes de pago inconsistentes.',
        );
      }

      if (saldoActual <= 0) {
        throw new ConflictException('La venta ya está pagada completamente.');
      }

      const monto = this.redondear(dto.monto);

      if (monto <= 0) {
        throw new BadRequestException(
          'El monto del pago debe ser mayor que cero.',
        );
      }

      if (monto > saldoActual) {
        throw new BadRequestException(
          `El pago no puede superar el saldo pendiente de ${saldoActual}.`,
        );
      }

      await this.crearRegistroPago(manager, venta, actor, {
        monto,
        metodoPago: dto.metodoPago,
        referencia: dto.referencia,
        observaciones: dto.observaciones,
      });

      const nuevoMontoPagado = this.redondear(montoAnterior + monto);
      const nuevoSaldo = this.redondear(totalVenta - nuevoMontoPagado);

      venta.montoPagado = nuevoMontoPagado;
      venta.saldoPendiente = nuevoSaldo;
      venta.estadoPago = this.calcularEstadoPago(totalVenta, nuevoMontoPagado);
      venta.medioPago = this.calcularMedioPagoAgregado(
        venta.medioPago,
        montoAnterior,
        dto.metodoPago,
      );

      await ventaRepository.save(venta);
    });

    return this.findOne(ventaId);
  }

  async listarPagosVenta(id: number) {
    const ventaId = this.validarId(id, 'ID de venta inválido.');

    const venta = await this.ventasRepository.findOne({
      where: {
        idVenta: ventaId,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada.');
    }

    const pagos = await this.pagosRepository.find({
      where: {
        idVenta: ventaId,
      },
      order: {
        createdAt: 'ASC',
        idPagoVenta: 'ASC',
      },
    });

    return pagos.map((pago) => ({
      idPagoVenta: pago.idPagoVenta,
      idVenta: pago.idVenta,
      idUsuario: pago.idUsuario ?? null,
      usuario: pago.usuario ?? null,
      metodoPago: pago.metodoPago,
      monto: Number(pago.monto),
      referencia: pago.referencia ?? null,
      observaciones: pago.observaciones ?? null,
      createdAt: pago.createdAt,
    }));
  }

  async enviarAPapelera(id: number) {
    const ventaId = this.validarId(id, 'ID de venta inválido.');

    const venta = await this.ventasRepository.findOne({
      where: {
        idVenta: ventaId,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada.');
    }

    venta.enPapelera = true;

    await this.ventasRepository.save(venta);

    return this.findOne(ventaId);
  }

  async restaurarDePapelera(id: number) {
    const ventaId = this.validarId(id, 'ID de venta inválido.');

    const venta = await this.ventasRepository.findOne({
      where: {
        idVenta: ventaId,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada.');
    }

    venta.enPapelera = false;

    await this.ventasRepository.save(venta);

    return this.findOne(ventaId);
  }

  async anularVenta(id: number, actor: ActorAuditoria) {
    const ventaId = this.validarId(id, 'ID de venta inválido.');

    await this.dataSource.transaction(async (manager) => {
      const ventaRepository = manager.getRepository(VentaEntity);
      const detalleRepository = manager.getRepository(DetalleVenta);
      const loteRepository = manager.getRepository(LoteProducto);

      /*
       * 1. Bloqueamos primero la Venta.
       * Esto evita que dos anulaciones puedan procesarla al mismo tiempo.
       */
      const venta = await ventaRepository
        .createQueryBuilder('venta')
        .setLock('pessimistic_write')
        .where('venta.id_venta = :ventaId', {
          ventaId,
        })
        .getOne();

      if (!venta) {
        throw new NotFoundException('Venta no encontrada.');
      }

      if (venta.estadoVenta === 'ANULADA') {
        throw new ConflictException('La venta ya está anulada.');
      }

      /*
       * 2. Los detalles son históricos. No los modificamos.
       */
      const detalles = await detalleRepository.find({
        where: {
          idVenta: ventaId,
        },
        order: {
          idDetalleVenta: 'ASC',
        },
      });

      if (detalles.length === 0) {
        throw new ConflictException(
          'La venta no contiene detalles para revertir.',
        );
      }

      /*
       * 3. Obtenemos los lotes únicos.
       */
      const loteIds = [...new Set(detalles.map((detalle) => detalle.idLote))];

      /*
       * 4. Bloqueamos TODOS los lotes en un orden determinista.
       */
      const lotes = await loteRepository
        .createQueryBuilder('lote')
        .setLock('pessimistic_write')
        .where('lote.id_lote IN (:...loteIds)', {
          loteIds,
        })
        .orderBy('lote.id_lote', 'ASC')
        .getMany();

      if (lotes.length !== loteIds.length) {
        throw new ConflictException(
          'Uno o más lotes asociados a la venta no existen.',
        );
      }

      const lotesPorId = new Map(lotes.map((lote) => [lote.idLote, lote]));

      /*
       * 5. Reponemos cada DetalleVenta y registramos su movimiento.
       */
      for (const detalle of detalles) {
        const lote = lotesPorId.get(detalle.idLote);

        if (!lote) {
          throw new ConflictException(
            `No se encontró el lote asociado al detalle ${detalle.idDetalleVenta}.`,
          );
        }

        if (lote.idProducto !== detalle.idProducto) {
          throw new ConflictException(
            `El lote ${lote.idLote} no corresponde al producto del detalle ${detalle.idDetalleVenta}.`,
          );
        }

        const cantidad = Number(detalle.cantidad);

        await this.reingresarStockLote(manager, lote, cantidad);

        await this.inventarioService.registrarMovimiento(manager, {
          lote,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad,
          referenciaId: venta.idVenta,
          actor,
        });
      }

      /*
       * 6. Finalmente anulamos la Venta.
       */
      venta.estadoVenta = 'ANULADA';
      venta.estadoPago = 'ANULADA';
      venta.saldoPendiente = 0;

      await ventaRepository.save(venta);
    });

    return this.findOne(ventaId);
  }

  private async calcularDetallesPorLinea(
    manager: EntityManager,
    detalleDto: CreateVentaDetalleDto,
  ): Promise<DetalleVentaCalculado[]> {
    const modoDescuentoLote = detalleDto.modoDescuentoLote ?? 'FIFO';
    const tarifa = await this.resolverTarifa(manager, detalleDto);
    const asignaciones = await this.asignarLotes(
      manager,
      detalleDto,
      modoDescuentoLote,
    );

    const subtotalOriginal = this.redondear(
      detalleDto.cantidad * detalleDto.precioUnitario,
    );

    const descuentoTotal = this.redondear(detalleDto.descuento ?? 0);

    if (descuentoTotal > subtotalOriginal) {
      throw new BadRequestException(
        'El descuento no puede ser mayor al subtotal de la línea.',
      );
    }

    let descuentoPendiente = descuentoTotal;

    return asignaciones.map((asignacion, index) => {
      const esUltimaLinea = index === asignaciones.length - 1;

      const subtotal = this.redondear(
        asignacion.cantidad * detalleDto.precioUnitario,
      );

      const descuento = esUltimaLinea
        ? this.redondear(descuentoPendiente)
        : this.redondear(
            descuentoTotal * (asignacion.cantidad / detalleDto.cantidad),
          );

      descuentoPendiente = this.redondear(descuentoPendiente - descuento);

      const baseImponible = this.redondear(subtotal - descuento);
      const iva = this.redondear(baseImponible * (tarifa.porcentajeIva / 100));
      const totalLinea = this.redondear(baseImponible + iva);
      const costoTotal = this.redondear(
        asignacion.cantidad * asignacion.costoUnitarioReal,
      );
      const gananciaBruta = this.redondear(baseImponible - costoTotal);

      return {
        lote: asignacion.lote,
        idProducto: detalleDto.productoId,
        idLote: asignacion.lote.idLote,
        cantidad: asignacion.cantidad,
        precioUnitario: this.redondear(detalleDto.precioUnitario),
        subtotal,
        descuento,
        baseImponible,
        tipoTarifa: detalleDto.tipoTarifa,
        idTarifaIva: tarifa.idTarifaIva,
        porcentajeIva: tarifa.porcentajeIva,
        iva,
        totalLinea,
        costoUnitarioReal: asignacion.costoUnitarioReal,
        costoTotal,
        gananciaBruta,
        modoDescuentoLote,
        detalle: detalleDto.detalle?.trim() || null,
      };
    });
  }

  private async asignarLotes(
    manager: EntityManager,
    detalleDto: CreateVentaDetalleDto,
    modoDescuentoLote: string,
  ): Promise<LoteAsignado[]> {
    if (modoDescuentoLote === 'MANUAL') {
      return this.asignarLoteManual(manager, detalleDto);
    }

    return this.asignarLotesFifo(manager, detalleDto);
  }

  private async asignarLoteManual(
    manager: EntityManager,
    detalleDto: CreateVentaDetalleDto,
  ): Promise<LoteAsignado[]> {
    if (!detalleDto.loteId) {
      throw new BadRequestException(
        'Debe seleccionar un lote cuando el modo es manual.',
      );
    }

    const lote = await manager
      .getRepository(LoteProducto)
      .createQueryBuilder('lote')
      .setLock('pessimistic_write')
      .where('lote.id_lote = :loteId', {
        loteId: detalleDto.loteId,
      })
      .andWhere('lote.id_producto = :productoId', {
        productoId: detalleDto.productoId,
      })
      .getOne();

    if (!lote) {
      throw new NotFoundException('Lote no encontrado para ese producto.');
    }

    if (!['EN_STOCK', 'VENDIDO_PARCIAL'].includes(lote.estadoLote)) {
      throw new BadRequestException(
        'Solo se pueden vender lotes en stock o vendidos parcialmente.',
      );
    }

    const disponible = Number(lote.cantidadDisponible);

    if (disponible < detalleDto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible en lote ${lote.codigoLote}: ${disponible}.`,
      );
    }

    const costoUnitarioReal = Number(lote.costoUnitarioReal);

    await this.descontarStockLote(manager, lote, detalleDto.cantidad);

    return [
      {
        lote,
        cantidad: detalleDto.cantidad,
        costoUnitarioReal,
      },
    ];
  }

  private async asignarLotesFifo(
    manager: EntityManager,
    detalleDto: CreateVentaDetalleDto,
  ): Promise<LoteAsignado[]> {
    const lotesDisponibles = await manager
      .getRepository(LoteProducto)
      .createQueryBuilder('lote')
      .setLock('pessimistic_write')
      .where('lote.id_producto = :productoId', {
        productoId: detalleDto.productoId,
      })
      .andWhere('lote.cantidad_disponible > 0')
      .andWhere('lote.estado_lote IN (:...estados)', {
        estados: ['EN_STOCK', 'VENDIDO_PARCIAL'],
      })
      .orderBy('lote.fecha_entrada', 'ASC')
      .addOrderBy('lote.id_lote', 'ASC')
      .getMany();

    if (lotesDisponibles.length === 0) {
      throw new BadRequestException(
        `No hay stock disponible para el producto ${detalleDto.productoId}.`,
      );
    }

    let cantidadPendiente = detalleDto.cantidad;
    const asignaciones: LoteAsignado[] = [];

    for (const lote of lotesDisponibles) {
      if (cantidadPendiente <= 0) break;

      const disponible = Number(lote.cantidadDisponible);
      const cantidadUsada = Math.min(disponible, cantidadPendiente);
      const costoUnitarioReal = Number(lote.costoUnitarioReal);

      await this.descontarStockLote(manager, lote, cantidadUsada);

      asignaciones.push({
        lote,
        cantidad: cantidadUsada,
        costoUnitarioReal,
      });

      cantidadPendiente -= cantidadUsada;
    }

    if (cantidadPendiente > 0) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${detalleDto.productoId}. Faltan ${cantidadPendiente} unidades.`,
      );
    }

    return asignaciones;
  }

  private async descontarStockLote(
    manager: EntityManager,
    lote: LoteProducto,
    cantidadVendida: number,
  ) {
    if (!Number.isInteger(cantidadVendida) || cantidadVendida <= 0) {
      throw new BadRequestException(
        'La cantidad vendida debe ser un entero positivo.',
      );
    }

    const disponibleActual = Number(lote.cantidadDisponible);

    if (!Number.isInteger(disponibleActual) || disponibleActual < 0) {
      throw new ConflictException(
        `El lote ${lote.idLote} contiene un stock inválido.`,
      );
    }

    const nuevoDisponible = disponibleActual - cantidadVendida;

    if (nuevoDisponible < 0) {
      throw new BadRequestException(
        `El lote ${lote.codigoLote} no tiene stock suficiente.`,
      );
    }

    lote.cantidadDisponible = nuevoDisponible;
    lote.estadoLote = nuevoDisponible === 0 ? 'AGOTADO' : 'VENDIDO_PARCIAL';

    await manager.save(LoteProducto, lote);
  }

  private async reingresarStockLote(
    manager: EntityManager,
    lote: LoteProducto,
    cantidadReingreso: number,
  ): Promise<void> {
    if (!Number.isInteger(cantidadReingreso) || cantidadReingreso <= 0) {
      throw new ConflictException(
        'La cantidad a reingresar debe ser un entero positivo.',
      );
    }

    const cantidadRecibida = Number(lote.cantidadRecibida);
    const cantidadDisponible = Number(lote.cantidadDisponible);

    if (
      !Number.isInteger(cantidadRecibida) ||
      !Number.isInteger(cantidadDisponible) ||
      cantidadRecibida < 0 ||
      cantidadDisponible < 0 ||
      cantidadDisponible > cantidadRecibida
    ) {
      throw new ConflictException(
        `El lote ${lote.idLote} contiene cantidades inconsistentes.`,
      );
    }

    const nuevoDisponible = cantidadDisponible + cantidadReingreso;

    if (nuevoDisponible > cantidadRecibida) {
      throw new ConflictException(
        `La anulación excedería la cantidad recibida del lote ${lote.idLote}.`,
      );
    }

    lote.cantidadDisponible = nuevoDisponible;

    if (nuevoDisponible === 0) {
      lote.estadoLote = 'AGOTADO';
    } else if (nuevoDisponible === cantidadRecibida) {
      lote.estadoLote = 'EN_STOCK';
    } else {
      lote.estadoLote = 'VENDIDO_PARCIAL';
    }

    await manager.save(LoteProducto, lote);
  }

  private async resolverTarifa(
    manager: EntityManager,
    detalleDto: CreateVentaDetalleDto,
  ): Promise<TarifaCalculada> {
    if (detalleDto.tipoTarifa === 'EXENTO') {
      return {
        idTarifaIva: null,
        porcentajeIva: 0,
      };
    }

    if (detalleDto.tipoTarifa === 'ESPECIAL') {
      if (
        detalleDto.porcentajeIva === undefined ||
        detalleDto.porcentajeIva === null
      ) {
        throw new BadRequestException(
          'Debe indicar el porcentaje para una tarifa especial.',
        );
      }

      return {
        idTarifaIva: null,
        porcentajeIva: this.redondear(detalleDto.porcentajeIva),
      };
    }

    if (detalleDto.idTarifaIva) {
      const tarifas = await manager.query<
        Array<{
          idTarifaIva: number;
          porcentaje: number | string;
          activo: boolean | number;
        }>
      >(
        `
        SELECT TOP 1
          id_tarifa_iva AS idTarifaIva,
          porcentaje,
          activo
        FROM dbo.tarifa_iva
        WHERE id_tarifa_iva = @0
        `,
        [detalleDto.idTarifaIva],
      );

      const tarifa = tarifas[0];

      if (!tarifa) {
        throw new NotFoundException('Tarifa IVA no encontrada.');
      }

      if (!tarifa.activo) {
        throw new BadRequestException(
          'La tarifa IVA seleccionada no está activa.',
        );
      }

      return {
        idTarifaIva: Number(tarifa.idTarifaIva),
        porcentajeIva: Number(tarifa.porcentaje),
      };
    }

    return {
      idTarifaIva: null,
      porcentajeIva: Number(detalleDto.porcentajeIva ?? 13),
    };
  }

  private calcularTotalesVenta(detalles: DetalleVentaCalculado[]) {
    const subtotal = this.redondear(
      detalles.reduce((acc, detalle) => acc + detalle.subtotal, 0),
    );

    const descuentoTotal = this.redondear(
      detalles.reduce((acc, detalle) => acc + detalle.descuento, 0),
    );

    const ivaTotal = this.redondear(
      detalles.reduce((acc, detalle) => acc + detalle.iva, 0),
    );

    const totalVenta = this.redondear(
      detalles.reduce((acc, detalle) => acc + detalle.totalLinea, 0),
    );

    const costoTotal = this.redondear(
      detalles.reduce((acc, detalle) => acc + detalle.costoTotal, 0),
    );

    const gananciaBruta = this.redondear(
      detalles.reduce((acc, detalle) => acc + detalle.gananciaBruta, 0),
    );

    const baseTotal = this.redondear(subtotal - descuentoTotal);

    const margenBruto =
      baseTotal > 0 ? this.redondear((gananciaBruta / baseTotal) * 100) : 0;

    return {
      subtotal,
      descuentoTotal,
      ivaTotal,
      totalVenta,
      costoTotal,
      gananciaBruta,
      margenBruto,
    };
  }

  private calcularEstadoPago(totalVenta: number, montoPagado: number) {
    if (montoPagado >= totalVenta) {
      return 'PAGADA';
    }

    if (montoPagado > 0) {
      return 'PARCIAL';
    }

    return 'EN_DEUDA';
  }

  private async validarNumeroVentaDisponible(numeroVenta: number) {
    const ventaExistente = await this.ventasRepository.findOne({
      where: {
        numeroVenta,
      },
    });

    if (ventaExistente) {
      throw new ConflictException(`Ya existe la venta ${numeroVenta}.`);
    }
  }

  private validarId(id: number, mensaje: string) {
    const numericId = Number(id);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new BadRequestException(mensaje);
    }

    return numericId;
  }

  private redondear(value: number) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Number(numericValue.toFixed(2));
  }

  private mapVentaToResponse(venta: VentaEntity) {
    return {
      id: venta.idVenta,
      numeroVenta: String(venta.numeroVenta),
      fechaVenta: venta.fechaVenta,
      clienteNombre: venta.clienteNombre ?? '',
      medioPago: venta.medioPago,
      estadoPago: venta.estadoPago,
      estadoVenta: venta.estadoVenta,
      subtotal: Number(venta.subtotal),
      descuentoTotal: Number(venta.descuentoTotal),
      ivaTotal: Number(venta.ivaTotal),
      totalVenta: Number(venta.totalVenta),
      montoPagado: Number(venta.montoPagado),
      saldoPendiente: Number(venta.saldoPendiente),
      costoTotal: Number(venta.costoTotal),
      gananciaBruta: Number(venta.gananciaBruta),
      margenBruto: Number(venta.margenBruto),
      fechaEntrega: venta.fechaEntrega,
      fechaVencimientoPago: venta.fechaVencimientoPago,
      observaciones: venta.observaciones ?? '',
      enPapelera: Boolean(venta.enPapelera),
      detalles: (venta.detalles ?? []).map((detalle) => ({
        id: detalle.idDetalleVenta,
        productoId: detalle.idProducto,
        productoNombre:
          detalle.producto?.nombre ?? `Producto ${detalle.idProducto}`,
        loteId: detalle.idLote,
        loteCodigo: detalle.lote?.codigoLote ?? `Lote ${detalle.idLote}`,
        pedidoId: detalle.lote?.idPedido,
        cantidad: Number(detalle.cantidad),
        precioUnitario: Number(detalle.precioUnitario),
        subtotal: Number(detalle.subtotal),
        descuento: Number(detalle.descuento),
        baseImponible: Number(detalle.baseImponible),
        tipoTarifa: detalle.tipoTarifa,
        idTarifaIva: detalle.idTarifaIva,
        porcentajeIva: Number(detalle.porcentajeIva),
        iva: Number(detalle.iva),
        totalLinea: Number(detalle.totalLinea),
        costoUnitarioReal: Number(detalle.costoUnitarioReal),
        costoTotal: Number(detalle.costoTotal),
        gananciaBruta: Number(detalle.gananciaBruta),
        modoDescuentoLote: detalle.modoDescuentoLote,
        detalle: detalle.detalle ?? '',
      })),
    };
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

  private calcularMedioPagoAgregado(
    medioActual: string,
    montoPagadoAnterior: number,
    nuevoMetodo: string,
  ): string {
    if (montoPagadoAnterior <= 0) {
      return nuevoMetodo;
    }

    if (medioActual === 'MIXTO') {
      return 'MIXTO';
    }

    if (medioActual === nuevoMetodo) {
      return medioActual;
    }

    return 'MIXTO';
  }

  private async crearRegistroPago(
    manager: EntityManager,
    venta: VentaEntity,
    actor: ActorAuditoria,
    input: {
      monto: number;
      metodoPago: string;
      referencia?: string | null;
      observaciones?: string | null;
    },
  ): Promise<PagoVenta> {
    if (!actor || !Number.isInteger(actor.idUsuario) || actor.idUsuario <= 0) {
      throw new ConflictException('El usuario de auditoría es inválido.');
    }

    const username = actor.username?.trim();

    if (!username) {
      throw new ConflictException('El usuario de auditoría es inválido.');
    }

    const monto = this.redondear(input.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
      throw new BadRequestException(
        'El monto del pago debe ser mayor que cero.',
      );
    }

    const pagoRepository = manager.getRepository(PagoVenta);

    const pago = pagoRepository.create({
      idVenta: venta.idVenta,
      idUsuario: actor.idUsuario,
      usuario: username,
      metodoPago: input.metodoPago,
      monto,
      referencia: this.normalizarTextoOpcional(input.referencia),
      observaciones: this.normalizarTextoOpcional(input.observaciones),
    });

    return pagoRepository.save(pago);
  }
}
