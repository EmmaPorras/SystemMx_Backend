import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../../database/entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  findAll() {
    return this.productoRepository.find({
      relations: {
        categoria: true,
      },
      order: {
        nombre: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const producto = await this.productoRepository.findOne({
      where: {
        idProducto: id,
      },
      relations: {
        categoria: true,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }
}
