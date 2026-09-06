import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';

import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { PedidoCompraEntity } from '../../database/entities/pedido-compra.entity';
import { Producto } from '../../database/entities/producto.entity';
import {
  CreatePedidoDetalleDto,
  CreatePedidoDto,
} from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

type CantidadesLoteCalculadas = {
  cantidadRecibida: number;
  cantidadDisponible: number;
  fechaEntrada: string | null;
};

@Injectable()
export class PedidosService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PedidoCompraEntity)
    private readonly pedidosRepository: Repository<PedidoCompraEntity>,
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
        fechaRecepcion: dto.estado === 'RECIBIDO' ? dto.fecha : null,
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
        fechaRecepcion: estado === 'RECIBIDO' ? fecha : null,
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
      await manager.delete(LoteProducto, { idPedido: pedidoId });
      await manager.delete(DetallePedidoCompra, { idPedido: pedidoId });
      await manager.delete(PedidoCompraEntity, { idPedido: pedidoId });
    });

    return {
      message: 'Pedido eliminado correctamente.',
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

    const cantidadesLote = this.calcularCantidadesLote(
      detalleDto,
      pedidoDto.fecha,
    );

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
      cantidadRecibida: cantidadesLote.cantidadRecibida,
      cantidadDisponible: cantidadesLote.cantidadDisponible,
      costoUnitarioReal,
      precioVentaRecomendado: detalleDto.precioVentaRecomendado,
      estadoLote: detalleDto.estadoLote,
      fechaEntrada: cantidadesLote.fechaEntrada,
      precioVentaFinal: null,
      tipoLote: 'COMPRA',
      costoPendienteAlVender: 0,
      observaciones: null,
    });

    await manager.save(LoteProducto, lote);
  }

  private calcularCantidadesLote(
    detalleDto: CreatePedidoDetalleDto,
    fechaPedido: string,
  ): CantidadesLoteCalculadas {
    const cantidad = Number(detalleDto.cantidad);
    const estadoLote = detalleDto.estadoLote;
    const cantidadRecibidaInput =
      detalleDto.cantidadRecibida !== undefined &&
      detalleDto.cantidadRecibida !== null
        ? Number(detalleDto.cantidadRecibida)
        : null;

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new BadRequestException('La cantidad del lote debe ser mayor a 0.');
    }

    if (estadoLote === 'EN_PROCESO') {
      return {
        cantidadRecibida: 0,
        cantidadDisponible: 0,
        fechaEntrada: null,
      };
    }

    if (estadoLote === 'EN_STOCK' || estadoLote === 'VENDIDO_PARCIAL') {
      const cantidadRecibida = cantidadRecibidaInput ?? cantidad;

      if (!Number.isInteger(cantidadRecibida)) {
        throw new BadRequestException(
          'La cantidad recibida debe ser un número entero.',
        );
      }

      if (cantidadRecibida <= 0) {
        throw new BadRequestException(
          'Si el lote está en stock, la cantidad recibida debe ser mayor a 0.',
        );
      }

      if (cantidadRecibida > cantidad) {
        throw new BadRequestException(
          'La cantidad recibida no puede ser mayor a la cantidad del lote.',
        );
      }

      return {
        cantidadRecibida,
        cantidadDisponible: cantidadRecibida,
        fechaEntrada: fechaPedido,
      };
    }

    if (estadoLote === 'AGOTADO') {
      const cantidadRecibida = cantidadRecibidaInput ?? cantidad;

      if (!Number.isInteger(cantidadRecibida)) {
        throw new BadRequestException(
          'La cantidad recibida debe ser un número entero.',
        );
      }

      if (cantidadRecibida < 0) {
        throw new BadRequestException(
          'La cantidad recibida no puede ser negativa.',
        );
      }

      if (cantidadRecibida > cantidad) {
        throw new BadRequestException(
          'La cantidad recibida no puede ser mayor a la cantidad del lote.',
        );
      }

      return {
        cantidadRecibida,
        cantidadDisponible: 0,
        fechaEntrada: cantidadRecibida > 0 ? fechaPedido : null,
      };
    }

    throw new BadRequestException('Estado de lote inválido.');
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

  private mapPedidoToResponse(pedido: PedidoCompraEntity) {
    const detalles = (pedido.lotes ?? []).map((lote) => {
      const producto = lote.producto;
      const cantidadInicial = Number(lote.cantidadInicial);
      const cantidadRecibida = Number(lote.cantidadRecibida ?? 0);

      return {
        idTemporal: String(lote.idLote),
        productoId: lote.idProducto,
        productoNombre: producto?.nombre ?? `Producto ${lote.idProducto}`,
        loteCodigo: lote.codigoLote,
        cantidad: cantidadInicial,
        cantidadRecibida,
        cantidadPendiente: Math.max(cantidadInicial - cantidadRecibida, 0),
        cantidadDisponible: Number(lote.cantidadDisponible),
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
