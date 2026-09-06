import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';

import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import { InventarioService } from '../inventario/inventario.service';
import {
  CreatePedidoDetalleDto,
  CreatePedidoDto,
} from './dto/create-pedido.dto';
import { RecepcionPedidoDto } from './dto/recepcion-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PedidoCompraEntity)
    private readonly pedidosRepository: Repository<PedidoCompraEntity>,

    private readonly inventarioService: InventarioService,
  ) {}

  async findAll() {
    const pedidos = await this.pedidosRepository.find({
      relations: {
        origenCompra: true,
        lotes: {
          producto: true,
          detallePedido: true,
        },
      },
      order: {
        idPedido: 'DESC',
      },
    });

    return pedidos.map((pedido) => this.mapPedidoToResponse(pedido));
  }

  async findOne(id: number) {
    const pedidoId = Number(id);

    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      throw new BadRequestException('ID de pedido inválido.');
    }

    const pedido = await this.pedidosRepository.findOne({
      where: { idPedido: pedidoId },
      relations: {
        origenCompra: true,
        lotes: {
          producto: true,
          detallePedido: true,
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    return this.mapPedidoToResponse(pedido);
  }

  async buscarProductosSugeridos(busqueda: string) {
    const textoBusqueda = this.normalizarNombreProducto(busqueda ?? '');

    if (textoBusqueda.length < 2) {
      return [];
    }

    const terminos = textoBusqueda.toLowerCase().split(' ').filter(Boolean);

    const productosRepository = this.dataSource.getRepository(Producto);

    const query = productosRepository
      .createQueryBuilder('producto')
      .where('producto.activo = :activo', {
        activo: true,
      });

    terminos.forEach((termino, index) => {
      query.andWhere(`LOWER(producto.nombre) LIKE :termino${index}`, {
        [`termino${index}`]: `%${termino}%`,
      });
    });

    const productos = await query
      .orderBy('producto.nombre', 'ASC')
      .take(10)
      .getMany();

    return productos.map((producto) => ({
      id: producto.idProducto,
      nombre: producto.nombre,
      nombreBusqueda: this.normalizarNombreProducto(
        producto.nombre,
      ).toLowerCase(),
      precioVentaSugerido: Number(producto.precioVentaSugeridoSinIva ?? 0),
      activo: producto.activo,
    }));
  }

  private async findOneByNumeroPedido(numeroPedido: number) {
    const pedido = await this.pedidosRepository.findOne({
      where: { numeroPedido },
      relations: {
        origenCompra: true,
        lotes: {
          producto: true,
          detallePedido: true,
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    return this.mapPedidoToResponse(pedido);
  }

  async create(dto: CreatePedidoDto) {
    await this.validarProveedorExiste(dto.proveedorId);
    await this.validarNumeroPedidoDisponible(dto.numeroPedido);

    await this.dataSource.transaction(async (manager) => {
      const subtotalProductos = dto.detalles.reduce(
        (acc, detalle) => acc + detalle.cantidad * detalle.costoUnitarioOrigen,
        0,
      );

      const inversionTotal = dto.detalles.reduce((acc, detalle) => {
        const totalOrigen = detalle.cantidad * detalle.costoUnitarioOrigen;
        return acc + totalOrigen * dto.tipoCambio;
      }, 0);

      const pedido = manager.create(PedidoCompraEntity, {
        numeroPedido: dto.numeroPedido,
        nombrePedido: `Pedido ${dto.numeroPedido}`,
        idOrigenCompra: dto.proveedorId,
        fechaPedido: dto.fecha,
        fechaRecepcion: null,
        estado: dto.estado,
        inversionTotal,
        costoEnvio: 0,
        impuestosImportacion: 0,
        observaciones: dto.observaciones?.trim() || null,
        paisCompra: dto.origen,
        monedaCompra: dto.monedaCompra,
        tipoCambio: dto.tipoCambio,
        subtotalProductos,
        envioInterno: 0,
        envioCasillero: 0,
        otrosGastos: 0,
        metodoRepartoGastos: 'SIN_GASTOS',
      });

      const pedidoGuardado = await manager.save(PedidoCompraEntity, pedido);

      for (const detalleDto of dto.detalles) {
        await this.crearDetalleYLote(
          manager,
          pedidoGuardado.idPedido,
          dto,
          detalleDto,
        );
      }
    });

    return this.findOneByNumeroPedido(dto.numeroPedido);
  }

  async update(id: number, dto: UpdatePedidoDto) {
    const pedidoId = Number(id);

    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      throw new BadRequestException('ID de pedido inválido.');
    }

    const pedidoActual = await this.pedidosRepository.findOne({
      where: { idPedido: pedidoId },
    });

    if (!pedidoActual) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (dto.proveedorId) {
      await this.validarProveedorExiste(dto.proveedorId);
    }

    if (dto.numeroPedido && dto.numeroPedido !== pedidoActual.numeroPedido) {
      await this.validarNumeroPedidoDisponible(dto.numeroPedido, pedidoId);
    }

    await this.dataSource.transaction(async (manager) => {
      await this.validarEdicionSegura(manager, pedidoActual, dto);

      const numeroPedido = dto.numeroPedido ?? pedidoActual.numeroPedido;
      const fecha = dto.fecha ?? pedidoActual.fechaPedido;
      const estado = dto.estado ?? pedidoActual.estado;
      const monedaCompra = dto.monedaCompra ?? pedidoActual.monedaCompra;
      const tipoCambio = dto.tipoCambio ?? Number(pedidoActual.tipoCambio);
      const proveedorId = dto.proveedorId ?? pedidoActual.idOrigenCompra;
      const origen = dto.origen ?? pedidoActual.paisCompra ?? '';

      const observaciones =
        dto.observaciones !== undefined
          ? dto.observaciones?.trim() || null
          : pedidoActual.observaciones;

      let subtotalProductos = Number(pedidoActual.subtotalProductos);
      let inversionTotal = Number(pedidoActual.inversionTotal);

      if (dto.detalles) {
        subtotalProductos = dto.detalles.reduce(
          (acc, detalle) =>
            acc + detalle.cantidad * detalle.costoUnitarioOrigen,
          0,
        );

        inversionTotal = dto.detalles.reduce((acc, detalle) => {
          const totalOrigen = detalle.cantidad * detalle.costoUnitarioOrigen;
          return acc + totalOrigen * tipoCambio;
        }, 0);
      }

      await manager.update(PedidoCompraEntity, pedidoId, {
        numeroPedido,
        nombrePedido: `Pedido ${numeroPedido}`,
        idOrigenCompra: proveedorId,
        fechaPedido: fecha,
        fechaRecepcion: pedidoActual.fechaRecepcion,
        estado,
        inversionTotal,
        observaciones,
        paisCompra: origen,
        monedaCompra,
        tipoCambio,
        subtotalProductos,
        envioInterno: pedidoActual.envioInterno,
        envioCasillero: pedidoActual.envioCasillero,
        otrosGastos: pedidoActual.otrosGastos,
        costoEnvio: pedidoActual.costoEnvio,
        impuestosImportacion: pedidoActual.impuestosImportacion,
        metodoRepartoGastos: pedidoActual.metodoRepartoGastos,
      });

      if (dto.detalles) {
        await manager.delete(LoteProducto, { idPedido: pedidoId });
        await manager.delete(DetallePedidoCompra, { idPedido: pedidoId });

        const pedidoDtoCompleto: CreatePedidoDto = {
          numeroPedido,
          fecha,
          origen,
          proveedorId,
          monedaCompra,
          tipoCambio,
          estado,
          observaciones: observaciones ?? undefined,
          detalles: dto.detalles,
        };

        for (const detalleDto of dto.detalles) {
          await this.crearDetalleYLote(
            manager,
            pedidoId,
            pedidoDtoCompleto,
            detalleDto,
          );
        }
      }
    });

    return this.findOne(pedidoId);
  }

  async remove(id: number) {
    const pedidoId = Number(id);

    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      throw new BadRequestException('ID de pedido inválido.');
    }

    const pedido = await this.pedidosRepository.findOne({
      where: { idPedido: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    await this.dataSource.transaction(async (manager) => {
      await this.validarCancelacionSegura(manager, pedido);

      await manager.update(PedidoCompraEntity, pedidoId, {
        estado: 'CANCELADO',
        fechaRecepcion: null,
      });
    });

    return {
      message: 'Pedido cancelado correctamente.',
      id: pedidoId,
    };
  }

  private async crearDetalleYLote(
    manager: EntityManager,
    idPedido: number,
    pedidoDto: CreatePedidoDto,
    detalleDto: CreatePedidoDetalleDto,
  ) {
    const producto = await this.obtenerProductoParaDetalle(manager, detalleDto);

    const totalOrigen = detalleDto.cantidad * detalleDto.costoUnitarioOrigen;
    const totalColones = totalOrigen * pedidoDto.tipoCambio;
    const costoTotalReal = totalColones;
    const costoUnitarioReal = costoTotalReal / detalleDto.cantidad;

    const detalle = manager.create(DetallePedidoCompra, {
      idPedido,
      idProducto: producto.idProducto,
      cantidad: detalleDto.cantidad,
      monedaOrigen: pedidoDto.monedaCompra,
      costoUnitarioOrigen: detalleDto.costoUnitarioOrigen,
      totalOrigen,
      tipoCambio: pedidoDto.tipoCambio,
      totalColones,
      envioAsignado: 0,
      impuestosAsignados: 0,
      otrosGastosAsignados: 0,
      costoTotalReal,
      costoUnitarioReal,
      precioVentaSugerido: detalleDto.precioVentaRecomendado,
      precioVentaFinal: null,
      metodoRepartoGastos: 'SIN_GASTOS',
      observaciones: null,
    });

    const detalleGuardado = await manager.save(DetallePedidoCompra, detalle);

    const lote = manager.create(LoteProducto, {
      idPedido,
      idProducto: producto.idProducto,
      idDetallePedido: detalleGuardado.idDetallePedido,
      codigoLote: detalleDto.loteCodigo,
      cantidadInicial: detalleDto.cantidad,
      cantidadRecibida: 0,
      cantidadDisponible: 0,
      costoUnitarioReal,
      precioVentaRecomendado: detalleDto.precioVentaRecomendado,
      estadoLote: 'EN_PROCESO',
      fechaEntrada: null,
      precioVentaFinal: null,
      tipoLote: 'COMPRA',
      costoPendienteAlVender: 0,
      observaciones: null,
    });

    await manager.save(LoteProducto, lote);
  }

  private async obtenerProductoParaDetalle(
    manager: EntityManager,
    detalleDto: CreatePedidoDetalleDto,
  ) {
    const productosRepository = manager.getRepository(Producto);

    if (detalleDto.productoId) {
      const productoExistente = await productosRepository.findOne({
        where: {
          idProducto: detalleDto.productoId,
        },
      });

      if (!productoExistente) {
        throw new NotFoundException(
          `El producto con ID ${detalleDto.productoId} no existe.`,
        );
      }

      return productoExistente;
    }

    return this.obtenerOCrearProducto(
      manager,
      detalleDto.productoNombre,
      detalleDto.precioVentaRecomendado,
    );
  }

  private async obtenerOCrearProducto(
    manager: EntityManager,
    productoNombre: string,
    precioVentaRecomendado: number,
  ) {
    const nombreNormalizado = this.normalizarNombreProducto(productoNombre);

    const productosRepository = manager.getRepository(Producto);

    const productoExistente = await productosRepository
      .createQueryBuilder('producto')
      .where('LOWER(LTRIM(RTRIM(producto.nombre))) = LOWER(:nombre)', {
        nombre: nombreNormalizado,
      })
      .getOne();

    if (productoExistente) {
      return productoExistente;
    }

    const nuevoProducto = productosRepository.create({
      idCategoria: null,
      idTarifaIva: null,
      nombre: nombreNormalizado,
      descripcion: null,
      sku: null,
      precioVentaSugeridoSinIva: precioVentaRecomendado,
      stockMinimo: 0,
      activo: true,
      marca: null,
      variante: null,
      imagenUrl: null,
      precioVentaEstandarConIva: null,
      costoReferencia: null,
      observaciones: 'Producto creado automáticamente desde pedidos.',
    });

    return productosRepository.save(nuevoProducto);
  }

  private normalizarNombreProducto(nombre: string) {
    return nombre.trim().replace(/\s+/g, ' ');
  }

  private async validarProveedorExiste(proveedorId: number) {
    const proveedor = await this.dataSource
      .getRepository(OrigenCompra)
      .findOne({
        where: {
          idOrigenCompra: proveedorId,
        },
      });

    if (!proveedor) {
      throw new NotFoundException(
        `El proveedor con ID ${proveedorId} no existe.`,
      );
    }

    if (proveedor.estado !== 'ACTIVO') {
      throw new ConflictException(
        `El proveedor con ID ${proveedorId} está inactivo.`,
      );
    }
  }

  private async validarNumeroPedidoDisponible(
    numeroPedido: number,
    pedidoIdActual?: number,
  ) {
    const pedidoExistente = await this.pedidosRepository.findOne({
      where: pedidoIdActual
        ? {
            numeroPedido,
            idPedido: Not(pedidoIdActual),
          }
        : {
            numeroPedido,
          },
    });

    if (pedidoExistente) {
      throw new ConflictException(`Ya existe el Pedido ${numeroPedido}.`);
    }
  }

  private tieneCambiosEstructurales(dto: UpdatePedidoDto): boolean {
    return (
      dto.numeroPedido !== undefined ||
      dto.fecha !== undefined ||
      dto.origen !== undefined ||
      dto.proveedorId !== undefined ||
      dto.monedaCompra !== undefined ||
      dto.tipoCambio !== undefined ||
      dto.estado !== undefined ||
      dto.detalles !== undefined
    );
  }

  private loteTieneInventarioMaterializado(lote: LoteProducto): boolean {
    const tieneFechaEntrada =
      lote.fechaEntrada !== null && lote.fechaEntrada !== undefined;

    return (
      Number(lote.cantidadRecibida) > 0 ||
      Number(lote.cantidadDisponible) > 0 ||
      tieneFechaEntrada ||
      ['EN_STOCK', 'VENDIDO_PARCIAL', 'AGOTADO'].includes(lote.estadoLote)
    );
  }

  private async validarEdicionSegura(
    manager: EntityManager,
    pedidoActual: PedidoCompraEntity,
    dto: UpdatePedidoDto,
  ): Promise<void> {
    if (pedidoActual.estado === 'CANCELADO') {
      throw new ConflictException('No se puede modificar un pedido cancelado.');
    }

    if (!this.tieneCambiosEstructurales(dto)) {
      return;
    }

    const lotes = await manager.getRepository(LoteProducto).find({
      where: {
        idPedido: pedidoActual.idPedido,
      },
    });

    const loteIds = lotes.map((lote) => lote.idLote);

    let cantidadDetallesVenta = 0;

    if (loteIds.length > 0) {
      cantidadDetallesVenta = await manager.getRepository(DetalleVenta).count({
        where: {
          idLote: In(loteIds),
        },
      });
    }

    if (cantidadDetallesVenta > 0) {
      throw new ConflictException(
        'No se puede modificar estructuralmente el pedido porque uno o más lotes ya fueron utilizados en ventas.',
      );
    }

    const tieneInventarioMaterializado = lotes.some((lote) =>
      this.loteTieneInventarioMaterializado(lote),
    );

    if (pedidoActual.estado === 'RECIBIDO' || tieneInventarioMaterializado) {
      throw new ConflictException(
        'No se puede modificar estructuralmente el pedido porque ya tiene mercancía recibida o inventario generado.',
      );
    }

    const cambiaMoneda =
      dto.monedaCompra !== undefined &&
      dto.monedaCompra !== pedidoActual.monedaCompra;

    const cambiaTipoCambio =
      dto.tipoCambio !== undefined &&
      Number(dto.tipoCambio) !== Number(pedidoActual.tipoCambio);

    if ((cambiaMoneda || cambiaTipoCambio) && dto.detalles === undefined) {
      throw new BadRequestException(
        'Para cambiar la moneda o el tipo de cambio debe enviar también los detalles del pedido para recalcular sus costos.',
      );
    }
  }

  private async validarCancelacionSegura(
    manager: EntityManager,
    pedido: PedidoCompraEntity,
  ): Promise<void> {
    if (pedido.estado === 'CANCELADO') {
      throw new ConflictException('El pedido ya se encuentra cancelado.');
    }

    const lotes = await manager.getRepository(LoteProducto).find({
      where: {
        idPedido: pedido.idPedido,
      },
    });

    const loteIds = lotes.map((lote) => lote.idLote);

    if (loteIds.length > 0) {
      const ventasAsociadas = await manager.getRepository(DetalleVenta).count({
        where: {
          idLote: In(loteIds),
        },
      });

      if (ventasAsociadas > 0) {
        throw new ConflictException(
          'No se puede cancelar el pedido porque uno o más lotes ya fueron utilizados en ventas.',
        );
      }
    }

    const tieneInventarioMaterializado = lotes.some((lote) =>
      this.loteTieneInventarioMaterializado(lote),
    );

    const tieneFechaRecepcion =
      pedido.fechaRecepcion !== null && pedido.fechaRecepcion !== undefined;

    if (
      pedido.estado === 'RECIBIDO' ||
      tieneFechaRecepcion ||
      tieneInventarioMaterializado
    ) {
      throw new ConflictException(
        'No se puede cancelar el pedido porque ya tiene mercancía recibida o inventario generado.',
      );
    }
  }

  private normalizarFechaSql(fecha: string): string {
    return fecha.slice(0, 10);
  }

  async recibir(id: number, dto: RecepcionPedidoDto) {
    const pedidoId = Number(id);

    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      throw new BadRequestException('ID de pedido inválido.');
    }

    const fechaRecepcion = this.normalizarFechaSql(dto.fechaRecepcion);

    await this.dataSource.transaction(async (manager) => {
      const pedidoRepository = manager.getRepository(PedidoCompraEntity);
      const loteRepository = manager.getRepository(LoteProducto);

      const pedido = await pedidoRepository
        .createQueryBuilder('pedido')
        .setLock('pessimistic_write')
        .where('pedido.idPedido = :pedidoId', {
          pedidoId,
        })
        .getOne();

      if (!pedido) {
        throw new NotFoundException('Pedido no encontrado.');
      }

      if (pedido.estado === 'CANCELADO') {
        throw new ConflictException(
          'No se puede recibir mercancía de un pedido cancelado.',
        );
      }

      if (pedido.estado === 'RECIBIDO') {
        throw new ConflictException('El pedido ya fue recibido completamente.');
      }

      if (fechaRecepcion < pedido.fechaPedido) {
        throw new BadRequestException(
          'La fecha de recepción no puede ser anterior a la fecha del pedido.',
        );
      }

      const loteIdsSolicitados = dto.detalles.map((detalle) => detalle.idLote);
      const loteIdsUnicos = new Set(loteIdsSolicitados);

      if (loteIdsUnicos.size !== loteIdsSolicitados.length) {
        throw new BadRequestException(
          'No se puede incluir el mismo lote más de una vez en una recepción.',
        );
      }

      const lotes = await loteRepository
        .createQueryBuilder('lote')
        .setLock('pessimistic_write')
        .where('lote.idPedido = :pedidoId', {
          pedidoId,
        })
        .getMany();

      if (lotes.length === 0) {
        throw new ConflictException('El pedido no tiene lotes para recibir.');
      }

      const lotesPorId = new Map(lotes.map((lote) => [lote.idLote, lote]));

      for (const detalleDto of dto.detalles) {
        const lote = lotesPorId.get(detalleDto.idLote);

        if (!lote) {
          throw new BadRequestException(
            `El lote con ID ${detalleDto.idLote} no pertenece al pedido ${pedidoId}.`,
          );
        }

        const cantidadInicial = Number(lote.cantidadInicial);
        const cantidadRecibidaAnterior = Number(lote.cantidadRecibida);
        const cantidadDisponibleAnterior = Number(lote.cantidadDisponible);

        if (
          !Number.isInteger(cantidadInicial) ||
          !Number.isInteger(cantidadRecibidaAnterior) ||
          !Number.isInteger(cantidadDisponibleAnterior) ||
          cantidadInicial <= 0 ||
          cantidadRecibidaAnterior < 0 ||
          cantidadDisponibleAnterior < 0 ||
          cantidadRecibidaAnterior > cantidadInicial ||
          cantidadDisponibleAnterior > cantidadRecibidaAnterior
        ) {
          throw new ConflictException(
            `El lote ${lote.idLote} contiene cantidades inconsistentes.`,
          );
        }

        if (lote.fechaEntrada && fechaRecepcion < lote.fechaEntrada) {
          throw new BadRequestException(
            `La nueva recepción del lote ${lote.idLote} no puede ser anterior a su primera entrada.`,
          );
        }

        const nuevaCantidadRecibida =
          cantidadRecibidaAnterior + detalleDto.cantidadRecibida;

        if (nuevaCantidadRecibida > cantidadInicial) {
          const pendiente = cantidadInicial - cantidadRecibidaAnterior;

          throw new BadRequestException(
            `El lote ${lote.idLote} solo tiene ${pendiente} unidades pendientes de recibir.`,
          );
        }
      }

      for (const detalleDto of dto.detalles) {
        const lote = lotesPorId.get(detalleDto.idLote)!;

        const cantidadRecibidaAnterior = Number(lote.cantidadRecibida);
        const cantidadDisponibleAnterior = Number(lote.cantidadDisponible);

        const nuevaCantidadRecibida =
          cantidadRecibidaAnterior + detalleDto.cantidadRecibida;

        const nuevaCantidadDisponible =
          cantidadDisponibleAnterior + detalleDto.cantidadRecibida;

        lote.cantidadRecibida = nuevaCantidadRecibida;
        lote.cantidadDisponible = nuevaCantidadDisponible;
        lote.fechaEntrada = lote.fechaEntrada ?? fechaRecepcion;

        if (nuevaCantidadDisponible <= 0) {
          lote.estadoLote = 'AGOTADO';
        } else if (nuevaCantidadDisponible >= nuevaCantidadRecibida) {
          lote.estadoLote = 'EN_STOCK';
        } else {
          lote.estadoLote = 'VENDIDO_PARCIAL';
        }

        await loteRepository.save(lote);

        await this.inventarioService.registrarMovimiento(manager, {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: detalleDto.cantidadRecibida,
          referenciaId: pedido.idPedido,
        });
      }

      const todosRecibidos = lotes.every(
        (lote) => Number(lote.cantidadRecibida) >= Number(lote.cantidadInicial),
      );

      pedido.estado = todosRecibidos ? 'RECIBIDO' : 'EN_TRANSITO';
      pedido.fechaRecepcion = todosRecibidos ? fechaRecepcion : null;

      await pedidoRepository.save(pedido);
    });

    return this.findOne(pedidoId);
  }

  private mapPedidoToResponse(pedido: PedidoCompraEntity) {
    const detalles = (pedido.lotes ?? []).map((lote) => {
      const producto = lote.producto;
      const cantidadInicial = Number(lote.cantidadInicial);
      const cantidadRecibida = Number(lote.cantidadRecibida ?? 0);

      return {
        idTemporal: String(lote.idLote),
        loteId: lote.idLote,
        productoId: lote.idProducto,
        productoNombre: producto?.nombre ?? `Producto ${lote.idProducto}`,
        loteCodigo: lote.codigoLote,
        cantidad: cantidadInicial,
        cantidadRecibida,
        cantidadPendiente: Math.max(cantidadInicial - cantidadRecibida, 0),
        cantidadDisponible: Number(lote.cantidadDisponible),
        fechaEntrada: lote.fechaEntrada ?? null,
        costoUnitarioOrigen: Number(
          lote.detallePedido?.costoUnitarioOrigen ?? lote.costoUnitarioReal,
        ),
        costoUnitarioReal: Number(lote.costoUnitarioReal),
        precioVentaRecomendado: Number(lote.precioVentaRecomendado),
        estadoLote: lote.estadoLote,
      };
    });

    return {
      id: pedido.idPedido,
      numeroPedido: String(pedido.numeroPedido),
      fecha: pedido.fechaPedido,
      fechaRecepcion: pedido.fechaRecepcion,
      origen: pedido.paisCompra ?? '',
      proveedorId: pedido.idOrigenCompra,
      proveedorNombre:
        pedido.origenCompra?.nombreReferencia ??
        `Proveedor ${pedido.idOrigenCompra}`,
      monedaCompra: pedido.monedaCompra,
      tipoCambio: Number(pedido.tipoCambio).toFixed(2),
      inversionTotal: Number(pedido.inversionTotal),
      observaciones: pedido.observaciones ?? '',
      estado: pedido.estado,
      detalles,
    };
  }
}
