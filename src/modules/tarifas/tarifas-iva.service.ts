import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarifaIva } from '../../database/entities/tarifa-iva.entity';
import { CreateTarifaIvaDto } from './dto/create-tarifa-iva.dto';
import { UpdateTarifaIvaDto } from './dto/update-tarifa-iva.dto';

@Injectable()
export class TarifasIvaService {
  constructor(
    @InjectRepository(TarifaIva)
    private readonly tarifasRepository: Repository<TarifaIva>,
  ) {}

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }

  private async validarCodigoDisponible(
    codigo: string,
    idExcluir?: number,
  ): Promise<void> {
    const codigoNormalizado = this.normalizarCodigo(codigo);

    const query = this.tarifasRepository
      .createQueryBuilder('tarifa')
      .where('UPPER(LTRIM(RTRIM(tarifa.codigo))) = :codigo', {
        codigo: codigoNormalizado,
      });

    if (idExcluir !== undefined) {
      query.andWhere('tarifa.idTarifaIva <> :idExcluir', {
        idExcluir,
      });
    }

    const existente = await query.getOne();

    if (existente) {
      throw new ConflictException(
        `Ya existe una tarifa IVA con el código ${codigoNormalizado}`,
      );
    }
  }

  findAll() {
    return this.tarifasRepository.find({
      order: {
        idTarifaIva: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const tarifa = await this.tarifasRepository.findOne({
      where: {
        idTarifaIva: id,
      },
    });

    if (!tarifa) {
      throw new NotFoundException('Tarifa IVA no encontrada');
    }

    return tarifa;
  }

  async create(createTarifaIvaDto: CreateTarifaIvaDto) {
    const codigo = this.normalizarCodigo(createTarifaIvaDto.codigo);

    await this.validarCodigoDisponible(codigo);

    const tarifa = this.tarifasRepository.create({
      codigo,
      porcentaje: Number(createTarifaIvaDto.porcentaje),
      descripcion: createTarifaIvaDto.descripcion.trim(),
      estado: createTarifaIvaDto.estado,
    });

    return this.tarifasRepository.save(tarifa);
  }

  async update(id: number, updateTarifaIvaDto: UpdateTarifaIvaDto) {
    const tarifa = await this.findOne(id);

    if (typeof updateTarifaIvaDto.codigo === 'string') {
      const codigo = this.normalizarCodigo(updateTarifaIvaDto.codigo);

      await this.validarCodigoDisponible(codigo, id);

      tarifa.codigo = codigo;
    }

    if (
      updateTarifaIvaDto.porcentaje !== undefined &&
      updateTarifaIvaDto.porcentaje !== null
    ) {
      tarifa.porcentaje = Number(updateTarifaIvaDto.porcentaje);
    }

    if (typeof updateTarifaIvaDto.descripcion === 'string') {
      tarifa.descripcion = updateTarifaIvaDto.descripcion.trim();
    }

    if (typeof updateTarifaIvaDto.estado === 'string') {
      tarifa.estado = updateTarifaIvaDto.estado;
    }

    return this.tarifasRepository.save(tarifa);
  }

  async remove(id: number) {
    const tarifa = await this.findOne(id);

    tarifa.estado = 'INACTIVA';

    await this.tarifasRepository.save(tarifa);

    return {
      message: 'Tarifa IVA desactivada correctamente',
      id,
    };
  }
}
