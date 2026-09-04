import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrigenCompra } from '../../database/entities/origen-compra.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(OrigenCompra)
    private readonly proveedoresRepository: Repository<OrigenCompra>,
  ) {}

  private normalizarTextoOpcional(
    valor: string | null | undefined,
  ): string | null {
    return valor?.trim() || null;
  }

  findAll() {
    return this.proveedoresRepository.find({
      order: {
        idOrigenCompra: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const proveedor = await this.proveedoresRepository.findOne({
      where: {
        idOrigenCompra: id,
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return proveedor;
  }

  async create(createProveedorDto: CreateProveedorDto) {
    const proveedor = this.proveedoresRepository.create({
      tipoOrigen: createProveedorDto.tipoOrigen.trim(),
      nombreReferencia: createProveedorDto.nombreReferencia.trim(),
      telefono: createProveedorDto.telefono.trim(),
      correo: createProveedorDto.correo.trim().toLowerCase(),
      pais: createProveedorDto.pais.trim(),
      direccion: this.normalizarTextoOpcional(createProveedorDto.direccion),
      estado: createProveedorDto.estado,
      contacto: this.normalizarTextoOpcional(createProveedorDto.contacto),
      monedaPreferida:
        createProveedorDto.monedaPreferida?.trim().toUpperCase() || null,
      observaciones: this.normalizarTextoOpcional(
        createProveedorDto.observaciones,
      ),
    });

    return this.proveedoresRepository.save(proveedor);
  }

  async update(id: number, updateProveedorDto: UpdateProveedorDto) {
    const proveedor = await this.findOne(id);

    if (updateProveedorDto.tipoOrigen !== undefined) {
      proveedor.tipoOrigen = updateProveedorDto.tipoOrigen.trim();
    }

    if (updateProveedorDto.nombreReferencia !== undefined) {
      proveedor.nombreReferencia = updateProveedorDto.nombreReferencia.trim();
    }

    if (updateProveedorDto.telefono !== undefined) {
      proveedor.telefono = updateProveedorDto.telefono.trim();
    }

    if (updateProveedorDto.correo !== undefined) {
      proveedor.correo = updateProveedorDto.correo.trim().toLowerCase();
    }

    if (updateProveedorDto.pais !== undefined) {
      proveedor.pais = updateProveedorDto.pais.trim();
    }

    if (updateProveedorDto.direccion !== undefined) {
      proveedor.direccion = this.normalizarTextoOpcional(
        updateProveedorDto.direccion,
      );
    }

    if (updateProveedorDto.estado !== undefined) {
      proveedor.estado = updateProveedorDto.estado;
    }

    if (updateProveedorDto.contacto !== undefined) {
      proveedor.contacto = this.normalizarTextoOpcional(
        updateProveedorDto.contacto,
      );
    }

    if (updateProveedorDto.monedaPreferida !== undefined) {
      proveedor.monedaPreferida =
        updateProveedorDto.monedaPreferida?.trim().toUpperCase() || null;
    }

    if (updateProveedorDto.observaciones !== undefined) {
      proveedor.observaciones = this.normalizarTextoOpcional(
        updateProveedorDto.observaciones,
      );
    }

    return this.proveedoresRepository.save(proveedor);
  }

  async remove(id: number) {
    const proveedor = await this.findOne(id);

    await this.proveedoresRepository.remove(proveedor);

    return {
      message: 'Proveedor eliminado correctamente',
      id,
    };
  }
}
