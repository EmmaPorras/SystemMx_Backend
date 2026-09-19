import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { Producto } from '../../database/entities/producto.entity';

type StockProductoRaw = {
  idProducto: number | string;
  stockActual: number | string | null;
};

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,

    @InjectRepository(LoteProducto)
    private readonly lotesRepository: Repository<LoteProducto>,
  ) {}

  private async obtenerStockPorProductos(
    productoIds: number[],
  ): Promise<Map<number, number>> {
    if (productoIds.length === 0) {
      return new Map();
    }

    const filas = await this.lotesRepository
      .createQueryBuilder('lote')
      .select('lote.idProducto', 'idProducto')
      .addSelect('SUM(lote.cantidadDisponible)', 'stockActual')
      .where('lote.idProducto IN (:...productoIds)', {
        productoIds,
      })
      .groupBy('lote.idProducto')
      .getRawMany<StockProductoRaw>();

    return new Map(
      filas.map((fila) => [
        Number(fila.idProducto),
        Number(fila.stockActual ?? 0),
      ]),
    );
  }

  async findAll() {
    const productos = await this.productosRepository.find({
      relations: {
        categoria: true,
        tarifaIva: true,
      },
      order: {
        nombre: 'ASC',
      },
    });

    const stockPorProducto = await this.obtenerStockPorProductos(
      productos.map((producto) => producto.idProducto),
    );

    return productos.map((producto) => ({
      ...producto,
      stockActual: stockPorProducto.get(producto.idProducto) ?? 0,
    }));
  }

  async findOne(id: number) {
    const productoId = Number(id);

    if (!Number.isFinite(productoId) || productoId <= 0) {
      throw new BadRequestException('ID de producto inválido.');
    }

    const producto = await this.productosRepository.findOne({
      where: {
        idProducto: productoId,
      },
      relations: {
        categoria: true,
        tarifaIva: true,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const stockPorProducto = await this.obtenerStockPorProductos([productoId]);

    return {
      ...producto,
      stockActual: stockPorProducto.get(productoId) ?? 0,
    };
  }
}
