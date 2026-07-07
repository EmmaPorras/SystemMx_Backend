import { Injectable, NotFoundException } from '@nestjs/common';
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
    const tarifa = this.tarifasRepository.create({
      codigo: createTarifaIvaDto.codigo.trim().toUpperCase(),
      porcentaje: Number(createTarifaIvaDto.porcentaje),
      descripcion: createTarifaIvaDto.descripcion.trim(),
      estado: createTarifaIvaDto.estado,
    });

    return this.tarifasRepository.save(tarifa);
  }

  async update(id: number, updateTarifaIvaDto: UpdateTarifaIvaDto) {
    const tarifa = await this.findOne(id);

    if (updateTarifaIvaDto.codigo !== undefined) {
      tarifa.codigo = updateTarifaIvaDto.codigo.trim().toUpperCase();
    }

    if (updateTarifaIvaDto.porcentaje !== undefined) {
      tarifa.porcentaje = Number(updateTarifaIvaDto.porcentaje);
    }

    if (updateTarifaIvaDto.descripcion !== undefined) {
      tarifa.descripcion = updateTarifaIvaDto.descripcion.trim();
    }

    if (updateTarifaIvaDto.estado !== undefined) {
      tarifa.estado = updateTarifaIvaDto.estado;
    }

    return this.tarifasRepository.save(tarifa);
  }

  async remove(id: number) {
    const tarifa = await this.findOne(id);

    await this.tarifasRepository.remove(tarifa);

    return {
      message: 'Tarifa IVA eliminada correctamente',
      id,
    };
  }
}