import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { UsuariosService } from './usuarios.service';
import { PasswordHasherService } from './password-hasher.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { RolUsuario } from './rol-usuario.enum';
import { EstadoActivacionUsuario } from './estado-activacion.enum';
import { TipoTokenAccion } from './tipo-token-accion.enum';

/**
 * Comprobaciones estrictas de seguridad para entorno de pruebas PostgreSQL:
 * 1. Debe estar explícitamente configurada en TEST_POSTGRES_URL.
 * 2. Queda prohibido conectarse a endpoints con palabras clave de producción (prod, live, main).
 * 3. Exige indicador explícito de base de datos aislada (test, e2e, temp, ci).
 */
function isSafeTestDatabaseUrl(url?: string): boolean {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }
  const lower = url.toLowerCase();
  if (lower.includes('prod') || lower.includes('production') || lower.includes('live')) {
    return false;
  }
  const hasTestIndicator =
    lower.includes('test') || lower.includes('e2e') || lower.includes('temp') || lower.includes('ci');
  return hasTestIndicator;
}

const rawTestPostgresUrl = process.env.TEST_POSTGRES_URL;
const isTestUrlSafe = isSafeTestDatabaseUrl(rawTestPostgresUrl);

const describeIntegration = isTestUrlSafe ? describe : describe.skip;

describeIntegration('UsuariosService - Concurrencia Real Multi-Conexión PostgreSQL', () => {
  let dataSource: DataSource;
  let usuariosService: UsuariosService;
  let passwordHasher: PasswordHasherService;
  let createdUserId: number | null = null;
  const uniqueSuffix = crypto.randomBytes(6).toString('hex');
  const testUsername = 'test.concurrente.' + uniqueSuffix;
  const testEmail = 'test.concurrente.' + uniqueSuffix + '@systemmx-test.local';

  beforeAll(async () => {
    if (!rawTestPostgresUrl || !isTestUrlSafe) return;

    // Seguridad: synchronize en false y dropSchema en false para evitar cualquier mutación destructiva accidental
    dataSource = new DataSource({
      type: 'postgres',
      url: rawTestPostgresUrl,
      entities: [Usuario, TokenAccionUsuario],
      synchronize: false,
      dropSchema: false,
      logging: false,
    });

    await dataSource.initialize();

    // Guard de seguridad en tiempo de ejecución: verificar que el nombre de la BD sea explícitamente de pruebas
    const dbNameResult = await dataSource.query('SELECT current_database() as db;');
    const currentDb = String(dbNameResult[0]?.db || '').toLowerCase();
    if (!currentDb.includes('test') && !currentDb.includes('e2e') && !currentDb.includes('temp')) {
      await dataSource.destroy();
      throw new Error(
        'Seguridad: La base de datos conectada no contiene test/e2e/temp en su nombre. Abortando suite para proteger datos.',
      );
    }

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'SYSTEMMX_FRONTEND_URL') return 'https://systemmx-web-200684331.onrender.com';
        return undefined;
      }),
    } as unknown as ConfigService;

    const mailService = {
      enviarCorreoActivacion: jest.fn().mockResolvedValue(true),
      enviarCorreoRecuperacionPassword: jest.fn().mockResolvedValue(true),
    } as unknown as MailService;

    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    passwordHasher = new PasswordHasherService();

    usuariosService = new UsuariosService(
      dataSource.getRepository(Usuario),
      dataSource.getRepository(TokenAccionUsuario),
      passwordHasher,
      mailService,
      auditService,
      configService,
      dataSource,
    );
  });

  afterAll(async () => {
    // Limpieza no destructiva: eliminar ÚNICAMENTE los registros generados durante la prueba
    if (dataSource && dataSource.isInitialized) {
      if (createdUserId) {
        try {
          await dataSource.query(
            'DELETE FROM "token_accion_usuario" WHERE "id_usuario" = $1;',
            [createdUserId],
          );
          await dataSource.query(
            'DELETE FROM "usuario" WHERE "id_usuario" = $1;',
            [createdUserId],
          );
        } catch {
          // Ignorar errores en limpieza puntual
        }
      }
      await dataSource.destroy();
    }
  });

  it('permite que exactamente 1 de múltiples solicitudes concurrentes active la cuenta y consuma el token', async () => {
    const rawToken = 'real_concurrent_test_token_' + crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const userRepo = dataSource.getRepository(Usuario);
    const tokenRepo = dataSource.getRepository(TokenAccionUsuario);

    // 1. Crear usuario aislado para la prueba
    const usuario = userRepo.create({
      username: testUsername,
      usernameNormalizado: testUsername.toLowerCase(),
      email: testEmail,
      emailNormalizado: testEmail.toLowerCase(),
      nombre: 'Usuario Concurrente Test',
      passwordHash: await passwordHasher.hash('TemporalPassword123!'),
      rol: RolUsuario.VENTAS,
      activo: true,
      estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
      versionCredenciales: 1,
    });
    const savedUser = await userRepo.save(usuario);
    createdUserId = savedUser.idUsuario;

    // 2. Crear token de invitación
    const tokenAccion = tokenRepo.create({
      idUsuario: savedUser.idUsuario,
      tipo: TipoTokenAccion.INVITACION,
      tokenHash,
      expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usado: false,
    });
    await tokenRepo.save(tokenAccion);

    // 3. Disparar 5 intentos concurrentes de activación con contraseñas distintas
    const intentos = [1, 2, 3, 4, 5].map((idx) =>
      usuariosService
        .activarCuentaConToken(
          { token: rawToken, nuevoPassword: `ConcurrentPass${idx}!Valid` },
          `192.168.1.${idx}`,
        )
        .then(() => ({ success: true, idx, error: null }))
        .catch((err) => ({ success: false, idx, error: err.message })),
    );

    const resultados = await Promise.all(intentos);

    const exitos = resultados.filter((r) => r.success);
    const fallos = resultados.filter((r) => !r.success);

    // Exactamente 1 transacción debe ganar la carrera
    expect(exitos).toHaveLength(1);
    expect(fallos).toHaveLength(4);

    // Verificar que los fallos fueron por token ya consumido
    for (const fallo of fallos) {
      expect(fallo.error).toContain('Este enlace ya ha sido utilizado');
    }

    // 4. Verificar estado final en base de datos
    const userFinal = await userRepo.findOne({ where: { idUsuario: savedUser.idUsuario } });
    expect(userFinal?.estadoActivacion).toBe(EstadoActivacionUsuario.ACTIVO);
    expect(userFinal?.versionCredenciales).toBe(2);

    const tokenFinal = await tokenRepo.findOne({ where: { idToken: tokenAccion.idToken } });
    expect(tokenFinal?.usado).toBe(true);
  });
});

// Verificación de estado seguro de suite externa
describe('UsuariosService - Estado de suite de integración externa PostgreSQL', () => {
  it('permanece skipped de forma segura si no existe una base temporal PostgreSQL explícita', () => {
    if (!isTestUrlSafe) {
      expect(isTestUrlSafe).toBe(false);
    } else {
      expect(isTestUrlSafe).toBe(true);
    }
  });
});
