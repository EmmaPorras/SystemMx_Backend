import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Usuario } from '../../database/entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { PasswordHasherService } from './password-hasher.service';
import { UsuarioPublico } from './usuarios.types';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,

    private readonly passwordHasher: PasswordHasherService,
  ) {}

  private normalizarUsername(value: string): string {
    return value.trim().toLowerCase();
  }

  private mapearUsuario(usuario: Usuario): UsuarioPublico {
    return {
      idUsuario: usuario.idUsuario,
      username: usuario.username,
      nombre: usuario.nombre,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
  }

  private validarId(id: number): number {
    const usuarioId = Number(id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('ID de usuario inválido.');
    }

    return usuarioId;
  }

  private esErrorUsernameDuplicado(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const driverError = (
      error as {
        driverError?: {
          number?: number;
        };
      }
    ).driverError;

    return driverError?.number === 2601 || driverError?.number === 2627;
  }

  async crear(dto: CreateUsuarioDto): Promise<UsuarioPublico> {
    const username = dto.username.trim();
    const usernameNormalizado = this.normalizarUsername(dto.username);
    const nombre = dto.nombre.trim();

    if (nombre.length < 2) {
      throw new BadRequestException(
        'El nombre debe contener al menos 2 caracteres.',
      );
    }

    const existente = await this.usuariosRepository.findOne({
      where: {
        usernameNormalizado,
      },
    });

    if (existente) {
      throw new ConflictException('El username ya está registrado.');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const usuario = this.usuariosRepository.create({
      username,
      usernameNormalizado,
      nombre,
      passwordHash,
      activo: true,
    });

    try {
      const guardado = await this.usuariosRepository.save(usuario);
      return this.mapearUsuario(guardado);
    } catch (error) {
      if (this.esErrorUsernameDuplicado(error)) {
        throw new ConflictException('El username ya está registrado.');
      }
      throw error;
    }
  }

  async findAll(): Promise<UsuarioPublico[]> {
    const usuarios = await this.usuariosRepository.find({
      order: {
        username: 'ASC',
      },
    });

    return usuarios.map((usuario) => this.mapearUsuario(usuario));
  }

  async findOne(id: number): Promise<UsuarioPublico> {
    const usuarioId = this.validarId(id);

    const usuario = await this.usuariosRepository.findOne({
      where: {
        idUsuario: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return this.mapearUsuario(usuario);
  }

  async buscarParaAutenticacion(username: string): Promise<Usuario | null> {
    const usernameNormalizado = this.normalizarUsername(username);

    if (usernameNormalizado.length === 0) {
      return null;
    }

    return this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .where('usuario.usernameNormalizado = :usernameNormalizado', {
        usernameNormalizado,
      })
      .getOne();
  }

  async cambiarPassword(
    id: number,
    nuevaPassword: string,
  ): Promise<UsuarioPublico> {
    const usuarioId = this.validarId(id);

    if (
      typeof nuevaPassword !== 'string' ||
      nuevaPassword.length < 12 ||
      nuevaPassword.length > 128
    ) {
      throw new BadRequestException(
        'La contraseña debe tener entre 12 y 128 caracteres.',
      );
    }

    const usuario = await this.usuariosRepository.findOne({
      where: {
        idUsuario: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    usuario.passwordHash = await this.passwordHasher.hash(nuevaPassword);

    const guardado = await this.usuariosRepository.save(usuario);

    return this.mapearUsuario(guardado);
  }

  async cambiarEstado(id: number, activo: boolean): Promise<UsuarioPublico> {
    const usuarioId = this.validarId(id);

    if (typeof activo !== 'boolean') {
      throw new BadRequestException('El estado del usuario es inválido.');
    }

    const usuario = await this.usuariosRepository.findOne({
      where: {
        idUsuario: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    usuario.activo = activo;

    const guardado = await this.usuariosRepository.save(usuario);

    return this.mapearUsuario(guardado);
  }
}
