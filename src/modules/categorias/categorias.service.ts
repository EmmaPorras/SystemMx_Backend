import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from '../../database/entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  private normalizarNombre(nombre: string): string {
    return nombre.trim();
  }

  private normalizarDescripcion(
    descripcion: string | null | undefined,
  ): string | null {
    if (descripcion === null || descripcion === undefined) {
      return null;
    }

    return descripcion.trim() || null;
  }

  private async validarNombreDisponible(
    nombre: string,
    idExcluir?: number,
  ): Promise<void> {
    const nombreNormalizado = this.normalizarNombre(nombre);

    const query = this.categoriaRepository
      .createQueryBuilder('categoria')
      .where('UPPER(LTRIM(RTRIM(categoria.nombre))) = :nombre', {
        nombre: nombreNormalizado.toUpperCase(),
      });

    if (idExcluir !== undefined) {
      query.andWhere('categoria.idCategoria <> :idExcluir', {
        idExcluir,
      });
    }

    const categoriaExistente = await query.getOne();

    if (categoriaExistente) {
      throw new ConflictException(
        `Ya existe una categoría con el nombre ${nombreNormalizado}`,
      );
    }
  }

  findAll() {
    return this.categoriaRepository.find({
      order: {
        nombre: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const categoria = await this.categoriaRepository.findOne({
      where: {
        idCategoria: id,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria;
  }

  async create(createCategoriaDto: CreateCategoriaDto) {
    const nombre = this.normalizarNombre(createCategoriaDto.nombre);

    await this.validarNombreDisponible(nombre);

    const categoria = this.categoriaRepository.create({
      nombre,
      descripcion: this.normalizarDescripcion(createCategoriaDto.descripcion),
      activo: createCategoriaDto.activo ?? true,
    });

    return this.categoriaRepository.save(categoria);
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto) {
    const categoria = await this.findOne(id);

    if (typeof updateCategoriaDto.nombre === 'string') {
      const nombre = this.normalizarNombre(updateCategoriaDto.nombre);

      await this.validarNombreDisponible(nombre, id);

      categoria.nombre = nombre;
    }

    if (updateCategoriaDto.descripcion !== undefined) {
      categoria.descripcion = this.normalizarDescripcion(
        updateCategoriaDto.descripcion,
      );
    }

    if (typeof updateCategoriaDto.activo === 'boolean') {
      categoria.activo = updateCategoriaDto.activo;
    }

    return this.categoriaRepository.save(categoria);
  }

  async remove(id: number) {
    const categoria = await this.findOne(id);

    categoria.activo = false;

    await this.categoriaRepository.save(categoria);

    return {
      message: 'Categoría desactivada correctamente',
      id,
    };
  }
}
