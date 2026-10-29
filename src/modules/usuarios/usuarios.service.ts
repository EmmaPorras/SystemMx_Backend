import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { resolveSqlExpr } from '../../database/column-types';
import { MailService } from '../mail/mail.service';
import { RegistroDto } from '../auth/dto/registro.dto';
import { validatePasswordPolicy } from './validators/password-policy.validator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { InvitarUsuarioDto } from './dto/invitar-usuario.dto';
import { EstadoActivacionUsuario } from './estado-activacion.enum';
import { TipoTokenAccion } from './tipo-token-accion.enum';
import { PasswordHasherService } from './password-hasher.service';
import { RolUsuario } from './rol-usuario.enum';
import { UsuarioPublico } from './usuarios.types';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,

    @InjectRepository(TokenAccionUsuario)
    private readonly tokenAccionRepository: Repository<TokenAccionUsuario>,

    private readonly passwordHasher: PasswordHasherService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private readonly logger = new Logger(UsuariosService.name);

  private normalizarUsername(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizarEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  private mapearUsuario(usuario: Usuario): UsuarioPublico {
    const publico: UsuarioPublico = {
      idUsuario: usuario.idUsuario,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
    if (usuario.email !== undefined) {
      publico.email = usuario.email ?? null;
    }
    if (usuario.estadoActivacion !== undefined) {
      publico.estadoActivacion = usuario.estadoActivacion;
    }
    return publico;
  }

  private validarId(id: number): number {
    const usuarioId = Number(id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('ID de usuario inválido.');
    }
    return usuarioId;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private buildActionUrl(
    route: '/activar-cuenta' | '/restablecer-contrasena',
    token: string,
  ): string {
    const base = this.getFrontendUrl();
    const hasHash = base.includes('#');
    const separator = hasHash ? (base.endsWith('/') ? '' : '/') : '/#/'; 
    return `${base}${separator}${route.replace(/^\/+/, '')}?token=${token}`;
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('SYSTEMMX_FRONTEND_URL') ||
      'https://systemmx-web-200684331.onrender.com'
    ).replace(/\/+$/, '');
  }

  private async bloquearAdminsActivos(
    manager: EntityManager,
  ): Promise<Usuario[]> {
    return manager
      .getRepository(Usuario)
      .createQueryBuilder('usuario')
      .setLock('pessimistic_write')
      .where('usuario.rol = :rol', {
        rol: RolUsuario.ADMIN,
      })
      .andWhere('usuario.activo = :activo', {
        activo: true,
      })
      .orderBy('usuario.idUsuario', 'ASC')
      .getMany();
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
      rol: dto.rol,
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

  async invitar(dto: InvitarUsuarioDto, ipSolicitud?: string) {
    const username = dto.username.trim();
    const usernameNormalizado = this.normalizarUsername(dto.username);
    const email = dto.email.trim();
    const emailNormalizado = this.normalizarEmail(dto.email);
    const nombre = dto.nombre.trim();

    if (nombre.length < 2) {
      throw new BadRequestException(
        'El nombre debe contener al menos 2 caracteres.',
      );
    }

    // Verificar unicidad de username
    const usuarioExistente = await this.usuariosRepository.findOne({
      where: { usernameNormalizado },
    });
    if (usuarioExistente) {
      throw new ConflictException('El username ya está registrado.');
    }

    // Verificar unicidad de email
    const emailExistente = await this.usuariosRepository.findOne({
      where: { emailNormalizado },
    });
    if (emailExistente) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // Contraseña inicial aleatoria inaccesible
    const dummyPassword = crypto.randomBytes(32).toString('hex');
    const dummyHash = await this.passwordHasher.hash(dummyPassword);

    const nuevoUsuario = this.usuariosRepository.create({
      username,
      usernameNormalizado,
      email,
      emailNormalizado,
      nombre,
      passwordHash: dummyHash,
      rol: dto.rol,
      activo: true,
      estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
    });

    const guardado = await this.usuariosRepository.save(nuevoUsuario);

    // Generar token seguro de 32 bytes (64 chars hex)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const horasExpiracion = Number(
      this.configService.get<string>('SYSTEMMX_INVITACION_EXPIRES_HOURS') || 24,
    );
    const expiraEn = new Date(Date.now() + horasExpiracion * 60 * 60 * 1000);

    const tokenAccion = this.tokenAccionRepository.create({
      idUsuario: guardado.idUsuario,
      tipo: TipoTokenAccion.INVITACION,
      tokenHash,
      expiraEn,
      usado: false,
      ipSolicitud: ipSolicitud || null,
    });
    await this.tokenAccionRepository.save(tokenAccion);

    const actionUrl = this.buildActionUrl('/activar-cuenta', rawToken);

    try {
      await this.mailService.enviarCorreoAccion({
        to: email,
        recipientName: nombre,
        type: 'INVITACION',
        actionUrl,
        expirationMinutes: horasExpiracion * 60,
        lang: dto.lang || 'es',
      });
    } catch (mailError: any) {
      // Si falla el envío de correo, mantenemos consistencia pero informamos claramente al admin
      throw new BadRequestException(
        `Usuario creado, pero falló el envío del correo de invitación: ${mailError.message}. Puedes reenviar la invitación desde la lista de usuarios.`,
      );
    }

    return {
      usuario: this.mapearUsuario(guardado),
      mensaje: 'Invitación enviada exitosamente.',
    };
  }

  async registrarPublico(dto: RegistroDto, ipSolicitud?: string) {
    const username = dto.username.trim();
    const usernameNormalizado = this.normalizarUsername(dto.username);
    const email = dto.email.trim();
    const emailNormalizado = this.normalizarEmail(dto.email);
    const nombre = dto.nombre.trim();

    if (nombre.length < 2) {
      throw new BadRequestException(
        'El nombre debe contener al menos 2 caracteres.',
      );
    }

    // Verificar unicidad de username
    const usuarioExistente = await this.usuariosRepository.findOne({
      where: { usernameNormalizado },
    });
    if (usuarioExistente) {
      throw new ConflictException('El nombre de usuario ya está registrado.');
    }

    // Verificar unicidad de email
    const emailExistente = await this.usuariosRepository.findOne({
      where: { emailNormalizado },
    });
    if (emailExistente) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // Hashear la contraseña con Argon2id
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // SEGURIDAD CRÍTICA: rol siempre DEMO con mínimos privilegios aislados
    const nuevoUsuario = this.usuariosRepository.create({
      username,
      usernameNormalizado,
      email,
      emailNormalizado,
      nombre,
      passwordHash,
      rol: RolUsuario.DEMO,
      activo: true,
      estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
      versionCredenciales: 1,
    });

    const guardado = await this.usuariosRepository.save(nuevoUsuario);

    // Generar token seguro de verificación
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const horasExpiracion = Number(
      this.configService.get<string>('SYSTEMMX_INVITACION_EXPIRES_HOURS') || 24,
    );
    const expiraEn = new Date(Date.now() + horasExpiracion * 60 * 60 * 1000);

    const tokenAccion = this.tokenAccionRepository.create({
      idUsuario: guardado.idUsuario,
      tipo: TipoTokenAccion.INVITACION,
      tokenHash,
      expiraEn,
      usado: false,
      ipSolicitud: ipSolicitud || null,
    });
    await this.tokenAccionRepository.save(tokenAccion);

    const actionUrl = this.buildActionUrl('/activar-cuenta', rawToken);

    let emailEnviado = false;
    try {
      await this.mailService.enviarCorreoAccion({
        to: email,
        recipientName: nombre,
        type: 'INVITACION',
        actionUrl,
        expirationMinutes: horasExpiracion * 60,
        lang: dto.lang || 'es',
      });
      emailEnviado = true;
    } catch (mailError: any) {
      this.logger.error(
        `Error al enviar correo de verificación de registro: ${mailError.message}`,
      );
      emailEnviado = false;
    }

    return {
      message: emailEnviado
        ? 'Registro exitoso. Se ha enviado un enlace de activación a tu correo electrónico.'
        : 'Tu cuenta fue creada exitosamente, pero no pudimos enviar el correo de activación en este momento debido a un problema temporal con el servicio de correo. Por favor solicita el reenvío del enlace de activación cuando lo desees.',
      emailEnviado,
      usuario: this.mapearUsuario(guardado),
    };
  }

  async reenviarInvitacion(id: number, ipSolicitud?: string) {
    const usuarioId = this.validarId(id);

    const usuario = await this.usuariosRepository.findOne({
      where: { idUsuario: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (usuario.estadoActivacion !== EstadoActivacionUsuario.PENDIENTE_ACTIVACION) {
      throw new BadRequestException('El usuario ya se encuentra activo.');
    }

    if (!usuario.email) {
      throw new BadRequestException(
        'El usuario no tiene una dirección de correo electrónico registrada.',
      );
    }

    // Rate limiting: verificar último token generado hace menos de 60 segundos
    const ultimoToken = await this.tokenAccionRepository.findOne({
      where: {
        idUsuario: usuarioId,
        tipo: TipoTokenAccion.INVITACION,
      },
      order: { createdAt: 'DESC' },
    });

    if (
      ultimoToken &&
      Date.now() - new Date(ultimoToken.createdAt).getTime() < 60_000
    ) {
      throw new BadRequestException(
        'Por favor espera al menos 1 minuto antes de reenviar otra invitación.',
      );
    }

    // Invalidar tokens previos de invitación
    await this.tokenAccionRepository.update(
      {
        idUsuario: usuarioId,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
      },
      {
        usado: true,
        usadoEn: new Date(),
      },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const horasExpiracion = Number(
      this.configService.get<string>('SYSTEMMX_INVITACION_EXPIRES_HOURS') || 24,
    );
    const expiraEn = new Date(Date.now() + horasExpiracion * 60 * 60 * 1000);

    const tokenAccion = this.tokenAccionRepository.create({
      idUsuario: usuarioId,
      tipo: TipoTokenAccion.INVITACION,
      tokenHash,
      expiraEn,
      usado: false,
      ipSolicitud: ipSolicitud || null,
    });
    await this.tokenAccionRepository.save(tokenAccion);

    const actionUrl = this.buildActionUrl('/activar-cuenta', rawToken);

    await this.mailService.enviarCorreoAccion({
      to: usuario.email,
      recipientName: usuario.nombre,
      type: 'INVITACION',
      actionUrl,
      expirationMinutes: horasExpiracion * 60,
      lang: 'es',
    });

    return {
      mensaje: 'Invitación reenviada exitosamente.',
    };
  }

  async reenviarActivacionPublico(
    email: string,
    ipSolicitud?: string,
    lang?: 'es' | 'en' | 'pt',
  ): Promise<{ message: string }> {
    const respuestaGenerica = {
      message:
        'Si la cuenta existe y está pendiente de activación, recibirás un nuevo enlace en tu correo electrónico.',
    };

    if (!email || typeof email !== 'string') {
      return respuestaGenerica;
    }

    const emailNormalizado = this.normalizarEmail(email);

    const usuario = await this.usuariosRepository.findOne({
      where: { emailNormalizado },
    });

    // Prevención de enumeración de cuentas: responder idéntico si no existe, o si está inactivo
    // o si ya se encuentra activado
    if (
      !usuario ||
      !usuario.activo ||
      usuario.estadoActivacion !== EstadoActivacionUsuario.PENDIENTE_ACTIVACION
    ) {
      return respuestaGenerica;
    }

    // Rate limiting por cuenta: verificar si el último token se generó hace menos de 60 segundos
    const ultimoToken = await this.tokenAccionRepository.findOne({
      where: {
        idUsuario: usuario.idUsuario,
        tipo: TipoTokenAccion.INVITACION,
      },
      order: { createdAt: 'DESC' },
    });

    if (
      ultimoToken &&
      Date.now() - new Date(ultimoToken.createdAt).getTime() < 60_000
    ) {
      // Ignorar silenciosamente para evitar flood y enumeración por temporización
      return respuestaGenerica;
    }

    // Invalidar tokens previos de invitación/activación
    await this.tokenAccionRepository.update(
      {
        idUsuario: usuario.idUsuario,
        tipo: TipoTokenAccion.INVITACION,
        usado: false,
      },
      {
        usado: true,
        usadoEn: new Date(),
      },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const horasExpiracion = Number(
      this.configService.get<string>('SYSTEMMX_INVITACION_EXPIRES_HOURS') || 24,
    );
    const expiraEn = new Date(Date.now() + horasExpiracion * 60 * 60 * 1000);

    const tokenAccion = this.tokenAccionRepository.create({
      idUsuario: usuario.idUsuario,
      tipo: TipoTokenAccion.INVITACION,
      tokenHash,
      expiraEn,
      usado: false,
      ipSolicitud: ipSolicitud || null,
    });
    await this.tokenAccionRepository.save(tokenAccion);

    const actionUrl = this.buildActionUrl('/activar-cuenta', rawToken);

    try {
      await this.mailService.enviarCorreoAccion({
        to: usuario.email!,
        recipientName: usuario.nombre,
        type: 'INVITACION',
        actionUrl,
        expirationMinutes: horasExpiracion * 60,
        lang: lang || 'es',
      });
    } catch (mailError: any) {
      this.logger.error(
        `Error al reenviar correo de activación: ${mailError.message}`,
      );
    }

    return respuestaGenerica;
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

  async buscarParaAutenticacion(identificador: string): Promise<Usuario | null> {
    const normalizado = identificador.trim().toLowerCase();

    if (normalizado.length === 0) {
      return null;
    }

    const qb = this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash');

    if (normalizado.includes('@')) {
      return qb
        .where('usuario.emailNormalizado = :emailNormalizado', {
          emailNormalizado: normalizado,
        })
        .getOne();
    }

    return qb
      .where('usuario.usernameNormalizado = :usernameNormalizado', {
        usernameNormalizado: normalizado,
      })
      .getOne();
  }

  async buscarParaSesion(id: number): Promise<{
    usuario: UsuarioPublico;
    versionCredenciales: number;
  } | null> {
    const usuarioId = Number(id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return null;
    }

    const usuario = await this.usuariosRepository.findOne({
      where: {
        idUsuario: usuarioId,
      },
    });

    if (!usuario) {
      return null;
    }

    return {
      usuario: this.mapearUsuario(usuario),
      versionCredenciales: Number(usuario.versionCredenciales),
    };
  }

  async cambiarPassword(
    id: number,
    nuevaPassword: string,
  ): Promise<UsuarioPublico> {
    const usuarioId = this.validarId(id);

    const policyResult = validatePasswordPolicy(nuevaPassword);
    if (!policyResult.isValid) {
      throw new BadRequestException(
        policyResult.message || 'La contraseña no cumple con la política de seguridad.',
      );
    }

    const passwordHash = await this.passwordHasher.hash(nuevaPassword);

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Usuario);

      const usuario = await repository
        .createQueryBuilder('usuario')
        .setLock('pessimistic_write')
        .where('usuario.idUsuario = :usuarioId', {
          usuarioId,
        })
        .getOne();

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      usuario.passwordHash = passwordHash;
      usuario.versionCredenciales = Number(usuario.versionCredenciales) + 1;

      const guardado = await repository.save(usuario);

      return this.mapearUsuario(guardado);
    });
  }

  async cambiarEstado(id: number, activo: boolean): Promise<UsuarioPublico> {
    const usuarioId = this.validarId(id);

    if (typeof activo !== 'boolean') {
      throw new BadRequestException('El estado del usuario es inválido.');
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Usuario);

      const adminsActivos = await this.bloquearAdminsActivos(manager);

      const usuario = await repository
        .createQueryBuilder('usuario')
        .setLock('pessimistic_write')
        .where('usuario.idUsuario = :usuarioId', {
          usuarioId,
        })
        .getOne();

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      if (usuario.activo === activo) {
        return this.mapearUsuario(usuario);
      }

      if (
        !activo &&
        usuario.activo &&
        usuario.rol === RolUsuario.ADMIN &&
        adminsActivos.length <= 1
      ) {
        throw new ConflictException(
          'No se puede desactivar el último administrador activo.',
        );
      }

      if (usuario.activo && !activo) {
        usuario.versionCredenciales = Number(usuario.versionCredenciales) + 1;
      }

      usuario.activo = activo;

      const guardado = await repository.save(usuario);

      return this.mapearUsuario(guardado);
    });
  }

  async cambiarRol(id: number, nuevoRol: RolUsuario): Promise<UsuarioPublico> {
    const usuarioId = this.validarId(id);

    if (!Object.values(RolUsuario).includes(nuevoRol)) {
      throw new BadRequestException('Rol de usuario inválido.');
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Usuario);

      const adminsActivos = await this.bloquearAdminsActivos(manager);

      const usuario = await repository
        .createQueryBuilder('usuario')
        .setLock('pessimistic_write')
        .where('usuario.idUsuario = :usuarioId', {
          usuarioId,
        })
        .getOne();

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      if (usuario.rol === nuevoRol) {
        return this.mapearUsuario(usuario);
      }

      if (
        usuario.activo &&
        usuario.rol === RolUsuario.ADMIN &&
        nuevoRol !== RolUsuario.ADMIN &&
        adminsActivos.length <= 1
      ) {
        throw new ConflictException(
          'No se puede quitar el rol al último administrador activo.',
        );
      }

      usuario.rol = nuevoRol;

      const guardado = await repository.save(usuario);

      return this.mapearUsuario(guardado);
    });
  }

  async contarUsuarios(): Promise<number> {
    return this.usuariosRepository.count();
  }

  // --- TOKEN Y RECUPERACIÓN / ACTIVACIÓN ---

  async validarTokenAccion(rawToken: string, tipo?: TipoTokenAccion) {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
      throw new BadRequestException('Token de acción requerido.');
    }

    const tokenHash = this.hashToken(rawToken.trim());

    const tokenEntity = await this.tokenAccionRepository.findOne({
      where: { tokenHash },
      relations: { usuario: true },
    });

    if (!tokenEntity) {
      throw new BadRequestException('El enlace es inválido o no existe.');
    }

    if (tokenEntity.usado) {
      throw new BadRequestException('Este enlace ya ha sido utilizado.');
    }

    if (new Date() > new Date(tokenEntity.expiraEn)) {
      throw new BadRequestException('Este enlace ha expirado.');
    }

    if (tipo && tokenEntity.tipo !== tipo) {
      throw new BadRequestException('Tipo de enlace inválido.');
    }

    if (!tokenEntity.usuario || !tokenEntity.usuario.activo) {
      throw new BadRequestException('La cuenta asociada no está disponible.');
    }

    return tokenEntity;
  }

  async solicitarRecuperacionPassword(
    email: string,
    ipSolicitud?: string,
    lang?: 'es' | 'en' | 'pt',
  ): Promise<void> {
    const emailNormalizado = this.normalizarEmail(email);

    const usuario = await this.usuariosRepository.findOne({
      where: { emailNormalizado },
    });

    // Prevención de enumeración de cuentas: si no existe o está inactivo, retornamos silenciosamente
    if (!usuario || !usuario.activo) {
      return;
    }

    // Rate limiting: evitar spam si se solicitó hace menos de 60s
    const ultimoToken = await this.tokenAccionRepository.findOne({
      where: {
        idUsuario: usuario.idUsuario,
        tipo: TipoTokenAccion.RECUPERACION_PASSWORD,
      },
      order: { createdAt: 'DESC' },
    });

    if (
      ultimoToken &&
      Date.now() - new Date(ultimoToken.createdAt).getTime() < 60_000
    ) {
      // Ignoramos silenciosamente para prevenir flooding de emails
      return;
    }

    // Invalidar tokens previos de recuperación
    await this.tokenAccionRepository.update(
      {
        idUsuario: usuario.idUsuario,
        tipo: TipoTokenAccion.RECUPERACION_PASSWORD,
        usado: false,
      },
      {
        usado: true,
        usadoEn: new Date(),
      },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const minutosExpiracion = Number(
      this.configService.get<string>('SYSTEMMX_RECUPERACION_EXPIRES_MINUTES') || 30,
    );
    const expiraEn = new Date(Date.now() + minutosExpiracion * 60 * 1000);

    const tokenAccion = this.tokenAccionRepository.create({
      idUsuario: usuario.idUsuario,
      tipo: TipoTokenAccion.RECUPERACION_PASSWORD,
      tokenHash,
      expiraEn,
      usado: false,
      ipSolicitud: ipSolicitud || null,
    });
    await this.tokenAccionRepository.save(tokenAccion);

    const actionUrl = this.buildActionUrl('/restablecer-contrasena', rawToken);

    try {
      await this.mailService.enviarCorreoAccion({
        to: usuario.email!,
        recipientName: usuario.nombre,
        type: 'RECUPERACION_PASSWORD',
        actionUrl,
        expirationMinutes: minutosExpiracion,
        lang: lang || 'es',
      });
    } catch {
      // No revelar fallos internos al cliente público
    }
  }

  private async consumirTokenTransaccional(
    rawToken: string,
    tipoEsperado: TipoTokenAccion,
    nuevaPassword: string,
  ): Promise<{ usuario: Usuario; tokenEntity: TokenAccionUsuario }> {
    if (
      !rawToken ||
      typeof rawToken !== 'string' ||
      rawToken.trim().length === 0
    ) {
      throw new BadRequestException('Token de acción requerido.');
    }

    const policyResult = validatePasswordPolicy(nuevaPassword);
    if (!policyResult.isValid) {
      throw new BadRequestException(
        policyResult.message || 'La contraseña no cumple con la política de seguridad.',
      );
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const passwordHash = await this.passwordHasher.hash(nuevaPassword);

    return this.dataSource.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(TokenAccionUsuario);
      const userRepo = manager.getRepository(Usuario);

      // 1. Bloqueo pesimista y consulta del token dentro de la transacción
      const tokenEntity = await tokenRepo
        .createQueryBuilder('token')
        .setLock('pessimistic_write')
        .where('token.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      if (!tokenEntity) {
        throw new BadRequestException('El enlace es inválido o no existe.');
      }

      if (tokenEntity.tipo !== tipoEsperado) {
        throw new BadRequestException('Tipo de enlace inválido.');
      }

      if (tokenEntity.usado) {
        throw new BadRequestException('Este enlace ya ha sido utilizado.');
      }

      if (new Date() > new Date(tokenEntity.expiraEn)) {
        throw new BadRequestException('Este enlace ha expirado.');
      }

      // 2. Bloqueo pesimista y consulta del usuario asociado
      const usuario = await userRepo
        .createQueryBuilder('usuario')
        .setLock('pessimistic_write')
        .where('usuario.idUsuario = :idUsuario', {
          idUsuario: tokenEntity.idUsuario,
        })
        .getOne();

      if (!usuario || !usuario.activo) {
        throw new BadRequestException('La cuenta asociada no está disponible.');
      }

      // 3. Consumo atómico condicional del token (garantiza exactamente 1 consumidor)
      const updateTokenResult = await tokenRepo
        .createQueryBuilder()
        .update(TokenAccionUsuario)
        .set({
          usado: true,
          usadoEn: new Date(),
        })
        .where('idToken = :idToken AND usado = :usado', {
          idToken: tokenEntity.idToken,
          usado: false,
        })
        .execute();

      if (updateTokenResult.affected === 0) {
        throw new BadRequestException('Este enlace ya ha sido utilizado.');
      }

      // 4. Modificar cuenta de usuario de forma atómica
      usuario.passwordHash = passwordHash;
      if (tipoEsperado === TipoTokenAccion.INVITACION) {
        usuario.estadoActivacion = EstadoActivacionUsuario.ACTIVO;
      }
      usuario.versionCredenciales = Number(usuario.versionCredenciales) + 1;

      await userRepo.save(usuario);

      return { usuario, tokenEntity };
    });
  }

  async activarCuentaConToken(rawToken: string, nuevaPassword: string) {
    await this.consumirTokenTransaccional(
      rawToken,
      TipoTokenAccion.INVITACION,
      nuevaPassword,
    );

    return {
      success: true,
      mensaje: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.',
    };
  }

  async restablecerPasswordConToken(rawToken: string, nuevaPassword: string) {
    await this.consumirTokenTransaccional(
      rawToken,
      TipoTokenAccion.RECUPERACION_PASSWORD,
      nuevaPassword,
    );

    return {
      success: true,
      mensaje:
        'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    };
  }
}