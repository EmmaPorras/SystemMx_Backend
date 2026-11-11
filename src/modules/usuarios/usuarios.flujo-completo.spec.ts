import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UsuariosService } from './usuarios.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { PasswordHasherService } from './password-hasher.service';
import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { RolUsuario } from './rol-usuario.enum';
import { EstadoActivacionUsuario } from './estado-activacion.enum';
import { TipoTokenAccion } from './tipo-token-accion.enum';

describe('Flujo Completo E2E: Invitacion, Activacion, Login, Recuperacion y Proteccion Antirreuso', () => {
  let usuariosService: UsuariosService;
  let authService: AuthService;
  let mailService: MailService;
  let passwordHasher: PasswordHasherService;

  const dbUsuarios: Usuario[] = [];
  const dbTokens: TokenAccionUsuario[] = [];
  const sentEmails: any[] = [];

  const mockUsuariosRepository = {
    create: jest.fn((dto) => ({
      idUsuario: dbUsuarios.length + 1,
      versionCredenciales: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...dto,
    })),
    save: jest.fn(async (user) => {
      const existingIdx = dbUsuarios.findIndex(
        (u) => u.idUsuario === user.idUsuario,
      );
      if (existingIdx !== -1) {
        dbUsuarios[existingIdx] = { ...dbUsuarios[existingIdx], ...user };
        return dbUsuarios[existingIdx];
      }
      dbUsuarios.push(user);
      return user;
    }),
    findOne: jest.fn(async ({ where }) => {
      if (where.idUsuario)
        return dbUsuarios.find((u) => u.idUsuario === where.idUsuario) || null;
      if (where.usernameNormalizado)
        return (
          dbUsuarios.find(
            (u) => u.usernameNormalizado === where.usernameNormalizado,
          ) || null
        );
      if (where.emailNormalizado)
        return (
          dbUsuarios.find(
            (u) => u.emailNormalizado === where.emailNormalizado,
          ) || null
        );
      return null;
    }),
    find: jest.fn(async () => [...dbUsuarios]),
    update: jest.fn(async (idOrCriteria, partial) => {
      const id =
        typeof idOrCriteria === 'object'
          ? idOrCriteria.idUsuario
          : idOrCriteria;
      const u = dbUsuarios.find((x) => x.idUsuario === id);
      if (u) {
        Object.assign(u, partial);
      }
      return { affected: u ? 1 : 0 };
    }),
    createQueryBuilder: jest.fn(() => {
      let whereFilter: Record<string, any> = {};
      const builder = {
        addSelect: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn((condition: string, params?: Record<string, any>) => {
          if (params) whereFilter = params;
          return builder;
        }),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(async () => {
          if (whereFilter.emailNormalizado) {
            return (
              dbUsuarios.find(
                (u) => u.emailNormalizado === whereFilter.emailNormalizado,
              ) || null
            );
          }
          if (whereFilter.usernameNormalizado) {
            return (
              dbUsuarios.find(
                (u) =>
                  u.usernameNormalizado === whereFilter.usernameNormalizado,
              ) || null
            );
          }
          if (whereFilter.idUsuario) {
            return (
              dbUsuarios.find((u) => u.idUsuario === whereFilter.idUsuario) ||
              null
            );
          }
          return null;
        }),
      };
      return builder;
    }),
  };

  const mockTokenRepository = {
    create: jest.fn((dto) => ({
      idToken: dbTokens.length + 1,
      createdAt: new Date(),
      ...dto,
    })),
    save: jest.fn(async (token) => {
      const existingIdx = dbTokens.findIndex(
        (t) => t.idToken === token.idToken,
      );
      if (existingIdx !== -1) {
        dbTokens[existingIdx] = { ...dbTokens[existingIdx], ...token };
        return dbTokens[existingIdx];
      }
      dbTokens.push(token);
      return token;
    }),
    findOne: jest.fn(async ({ where, relations }: any) => {
      const t = dbTokens.find((item) => {
        let match = true;
        if (where.tokenHash && item.tokenHash !== where.tokenHash)
          match = false;
        if (where.tipo && item.tipo !== where.tipo) match = false;
        if (where.idUsuario && item.idUsuario !== where.idUsuario)
          match = false;
        return match;
      });
      if (!t) return null;
      const hasUserRel =
        relations &&
        (Array.isArray(relations)
          ? relations.includes('usuario')
          : !!relations.usuario);
      if (hasUserRel) {
        return {
          ...t,
          usuario: dbUsuarios.find((u) => u.idUsuario === t.idUsuario) || null,
        };
      }
      return t;
    }),
    update: jest.fn(async (criteria, partial) => {
      if (typeof criteria === 'number') {
        const t = dbTokens.find((x) => x.idToken === criteria);
        if (t) Object.assign(t, partial);
        return { affected: t ? 1 : 0 };
      }
      dbTokens.forEach((t) => {
        if (criteria.idUsuario && t.idUsuario !== criteria.idUsuario) return;
        if (criteria.tipo && t.tipo !== criteria.tipo) return;
        if (criteria.usado !== undefined && t.usado !== criteria.usado) return;
        Object.assign(t, partial);
      });
      return { affected: 1 };
    }),
    createQueryBuilder: jest.fn(() => {
      let whereHash = '';
      let updateSet: Record<string, any> = {};
      let updateWhere: Record<string, any> = {};

      const builder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn((condition: string, params?: Record<string, any>) => {
          if (params?.tokenHash) whereHash = params.tokenHash;
          if (params?.idToken !== undefined) updateWhere = params;
          return builder;
        }),
        getOne: jest.fn(async () => {
          if (whereHash) {
            return dbTokens.find((t) => t.tokenHash === whereHash) || null;
          }
          return null;
        }),
        update: jest.fn().mockReturnThis(),
        set: jest.fn((vals: Record<string, any>) => {
          updateSet = vals;
          return builder;
        }),
        execute: jest.fn(async () => {
          const t = dbTokens.find(
            (item) =>
              item.idToken === updateWhere.idToken &&
              item.usado === updateWhere.usado,
          );
          if (t) {
            Object.assign(t, updateSet);
            return { affected: 1 };
          }
          return { affected: 0 };
        }),
      };
      return builder;
    }),
  };

  const mockMailService = {
    enviarCorreoAccion: jest.fn(async (params) => {
      sentEmails.push(params);
      return { exito: true, proveedor: 'test' };
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SYSTEMMX_FRONTEND_URL')
        return 'https://systemmx-web-200684331.onrender.com';
      if (key === 'JWT_EXPIRES_SECONDS') return '3600';
      if (key === 'SYSTEMMX_INVITACION_EXPIRES_HOURS') return '24';
      if (key === 'SYSTEMMX_RECUPERACION_EXPIRES_MINUTES') return '30';
      return null;
    }),
  };

  const mockJwtService = {
    signAsync: jest.fn(async () => 'mock-jwt-token-xyz'),
  };

  const mockDataSource = {
    transaction: jest.fn(async (cb) => {
      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === Usuario) return mockUsuariosRepository;
          if (entity === TokenAccionUsuario) return mockTokenRepository;
          return mockUsuariosRepository;
        }),
        save: jest.fn(async (e) => e),
      };
      return cb(mockManager);
    }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        AuthService,
        PasswordHasherService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuariosRepository,
        },
        {
          provide: getRepositoryToken(TokenAccionUsuario),
          useValue: mockTokenRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    usuariosService = module.get<UsuariosService>(UsuariosService);
    authService = module.get<AuthService>(AuthService);
    mailService = module.get<MailService>(MailService);
    passwordHasher = module.get<PasswordHasherService>(PasswordHasherService);
  });

  it('1. ADMIN invita a nuevo usuario', async () => {
    const res = await usuariosService.invitar(
      {
        username: 'colaborador.nuevo',
        nombre: 'Carlos Santana',
        email: 'carlos@systemmx.com',
        rol: RolUsuario.VENTAS,
        lang: 'es',
      },
      '192.168.1.50',
    );

    expect(res).toBeDefined();
    expect(res.usuario.username).toBe('colaborador.nuevo');
    expect(res.usuario.email).toBe('carlos@systemmx.com');
    expect(res.usuario.estadoActivacion).toBe(
      EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
    );

    const userInDb = dbUsuarios.find((u) => u.username === 'colaborador.nuevo');
    expect(userInDb).toBeDefined();
    expect(userInDb?.estadoActivacion).toBe(
      EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
    );
    expect(userInDb?.passwordHash).toBeDefined();
  });

  it('2. Usuario recibe correo con enlace seguro de HashRouter', () => {
    expect(sentEmails).toHaveLength(1);
    const sent = sentEmails[0];
    expect(sent.to).toBe('carlos@systemmx.com');
    expect(sent.type).toBe('INVITACION');
    expect(sent.actionUrl).toContain(
      'https://systemmx-web-200684331.onrender.com/#/activar-cuenta?token=',
    );

    const urlMatch = sent.actionUrl.match(/token=([a-f0-9]+)/);
    expect(urlMatch).not.toBeNull();
    const rawToken = urlMatch[1];
    expect(rawToken).toHaveLength(64);
  });

  it('3. Intento de login previo a activacion es rechazado', async () => {
    await expect(
      authService.login({
        username: 'colaborador.nuevo',
        password: 'CualquierPassword123!',
      }),
    ).rejects.toThrow('pendiente de activaci');
  });

  it('4. Usuario valida su token de invitacion y activa su cuenta', async () => {
    const sent = sentEmails[0];
    const rawToken = sent.actionUrl.match(/token=([a-f0-9]+)/)[1];

    // Validacion previa al formulario
    const validacion = await authService.validarTokenAccion(
      rawToken,
      TipoTokenAccion.INVITACION,
    );
    expect(validacion.valid).toBe(true);
    expect(validacion.nombre).toBe('Carlos Santana');

    // Activacion definiendo su contrasea segura
    const resActivacion = await authService.activarCuenta({
      token: rawToken,
      password: 'MiPasswordSuperSegura2026!',
    });

    expect(resActivacion.mensaje).toContain('Cuenta activada exitosamente');

    const userInDb = dbUsuarios.find((u) => u.username === 'colaborador.nuevo');
    expect(userInDb?.estadoActivacion).toBe(EstadoActivacionUsuario.ACTIVO);
    expect(
      await passwordHasher.verify(
        userInDb!.passwordHash,
        'MiPasswordSuperSegura2026!',
      ),
    ).toBe(true);
  });

  it('5. Login con contrasena recien activada (por username y por email)', async () => {
    // Login por username
    const loginUsername = await authService.login({
      username: 'colaborador.nuevo',
      password: 'MiPasswordSuperSegura2026!',
    });
    expect(loginUsername.accessToken).toBe('mock-jwt-token-xyz');
    expect(loginUsername.usuario.username).toBe('colaborador.nuevo');

    // Login por email
    const loginEmail = await authService.login({
      username: 'carlos@systemmx.com',
      password: 'MiPasswordSuperSegura2026!',
    });
    expect(loginEmail.accessToken).toBe('mock-jwt-token-xyz');
  });

  it('6. Solicitud de recuperacion de contrasena', async () => {
    const sentCountBefore = sentEmails.length;

    const res = await authService.solicitarRecuperacionPassword({
      email: 'carlos@systemmx.com',
      lang: 'es',
    });

    expect(res.message).toContain('Si el correo');
    expect(sentEmails.length).toBe(sentCountBefore + 1);

    const emailRecuperacion = sentEmails[sentEmails.length - 1];
    expect(emailRecuperacion.type).toBe('RECUPERACION_PASSWORD');
    expect(emailRecuperacion.actionUrl).toContain(
      '/#/restablecer-contrasena?token=',
    );
  });

  it('7. Restablecimiento exitoso con nueva contrasena', async () => {
    const emailRecuperacion = sentEmails[sentEmails.length - 1];
    const rawRecoveryToken =
      emailRecuperacion.actionUrl.match(/token=([a-f0-9]+)/)[1];

    const res = await authService.restablecerPassword({
      token: rawRecoveryToken,
      password: 'PasswordRenovada2026!',
    });

    expect(res.mensaje).toContain('Contraseña restablecida');

    // Verificar que la nueva contrasena funciona
    const loginNuevo = await authService.login({
      username: 'colaborador.nuevo',
      password: 'PasswordRenovada2026!',
    });
    expect(loginNuevo.accessToken).toBeDefined();

    // La contrasena antigua ya no funciona
    await expect(
      authService.login({
        username: 'colaborador.nuevo',
        password: 'MiPasswordSuperSegura2026!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('8. Proteccion antirreuso: invalidacion estricta de tokens reutilizados', async () => {
    const emailRecuperacion = sentEmails[sentEmails.length - 1];
    const rawRecoveryToken =
      emailRecuperacion.actionUrl.match(/token=([a-f0-9]+)/)[1];

    // Intentar reutilizar el token de recuperacion
    await expect(
      authService.validarTokenAccion(
        rawRecoveryToken,
        TipoTokenAccion.RECUPERACION_PASSWORD,
      ),
    ).rejects.toThrow('Este enlace ya ha sido utilizado');

    await expect(
      authService.restablecerPassword({
        token: rawRecoveryToken,
        password: 'OtraPasswordMas!',
      }),
    ).rejects.toThrow('Este enlace ya ha sido utilizado');

    // Intentar reutilizar el token de invitacion original
    const emailInvitacion = sentEmails[0];
    const rawInviteToken =
      emailInvitacion.actionUrl.match(/token=([a-f0-9]+)/)[1];

    await expect(
      authService.validarTokenAccion(
        rawInviteToken,
        TipoTokenAccion.INVITACION,
      ),
    ).rejects.toThrow('Este enlace ya ha sido utilizado');

    await expect(
      authService.activarCuenta({
        token: rawInviteToken,
        password: 'OtraPasswordMas!',
      }),
    ).rejects.toThrow('Este enlace ya ha sido utilizado');
  });
});
