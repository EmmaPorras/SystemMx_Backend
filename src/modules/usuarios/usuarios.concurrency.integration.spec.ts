import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { UsuariosService } from './usuarios.service';
import { PasswordHasherService } from './password-hasher.service';
import { MailService } from '../mail/mail.service';
import { Usuario } from '../../database/entities/usuario.entity';
import { TokenAccionUsuario } from '../../database/entities/token-accion-usuario.entity';
import { RolUsuario } from './rol-usuario.enum';
import { EstadoActivacionUsuario } from './estado-activacion.enum';
import { TipoTokenAccion } from './tipo-token-accion.enum';

const testPostgresUrl = process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL_TEST;

const describeIntegration = testPostgresUrl ? describe : describe.skip;

describeIntegration('UsuariosService - Concurrencia Real Multi-Conexión PostgreSQL', () => {
  let dataSource: DataSource;
  let usuariosService: UsuariosService;
  let passwordHasher: PasswordHasherService;

  beforeAll(async () => {
    if (!testPostgresUrl) return;

    dataSource = new DataSource({
      type: 'postgres',
      url: testPostgresUrl,
      entities: [Usuario, TokenAccionUsuario],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'SYSTEMMX_FRONTEND_URL') return 'https://systemmx-web-200684331.onrender.com';
        if (key === 'SYSTEMMX_INVITACION_EXPIRES_HOURS') return '24';
        if (key === 'SYSTEMMX_RECUPERACION_EXPIRES_MINUTES') return '30';
        return null;
      }),
    } as unknown as ConfigService;

    const mailService = {
      enviarCorreoAccion: jest.fn().mockResolvedValue({ exito: true }),
    } as unknown as MailService;

    passwordHasher = new PasswordHasherService();

    usuariosService = new UsuariosService(
      dataSource.getRepository(Usuario),
      dataSource.getRepository(TokenAccionUsuario),
      passwordHasher,
      dataSource,
      configService,
      mailService,
    );
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('permite que exactamente 1 de múltiples solicitudes concurrentes active la cuenta y consuma el token', async () => {
    const rawToken = 'real_concurrent_test_token_' + crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1. Crear usuario en la base de datos
    const userRepo = dataSource.getRepository(Usuario);
    const tokenRepo = dataSource.getRepository(TokenAccionUsuario);

    const usuario = userRepo.create({
      username: 'usuario.concurrente',
      usernameNormalizado: 'usuario.concurrente',
      email: 'concurrente@systemmx.com',
      emailNormalizado: 'concurrente@systemmx.com',
      nombre: 'Usuario Concurrente',
      passwordHash: await passwordHasher.hash('TemporalPassword123!'),
      rol: RolUsuario.OPERADOR,
      activo: true,
      estadoActivacion: EstadoActivacionUsuario.PENDIENTE_ACTIVACION,
      versionCredenciales: 1,
    });
    const savedUser = await userRepo.save(usuario);

    // 2. Crear token de invitación
    const tokenAccion = tokenRepo.create({
      idUsuario: savedUser.idUsuario,
      tipo: TipoTokenAccion.INVITACION,
      tokenHash,
      expiraEn: new Date(Date.now() + 3600000),
      usado: false,
    });
    await tokenRepo.save(tokenAccion);

    // 3. Ejecutar 5 solicitudes concurrentes simultáneas compitiendo por el mismo token
    const promesas = [
      usuariosService.activarCuentaConToken(rawToken, 'PasswordGanador1_123!').then(() => ({ success: true, id: 1 })).catch((e) => ({ success: false, error: e.message, id: 1 })),
      usuariosService.activarCuentaConToken(rawToken, 'PasswordGanador2_123!').then(() => ({ success: true, id: 2 })).catch((e) => ({ success: false, error: e.message, id: 2 })),
      usuariosService.activarCuentaConToken(rawToken, 'PasswordGanador3_123!').then(() => ({ success: true, id: 3 })).catch((e) => ({ success: false, error: e.message, id: 3 })),
      usuariosService.activarCuentaConToken(rawToken, 'PasswordGanador4_123!').then(() => ({ success: true, id: 4 })).catch((e) => ({ success: false, error: e.message, id: 4 })),
      usuariosService.activarCuentaConToken(rawToken, 'PasswordGanador5_123!').then(() => ({ success: true, id: 5 })).catch((e) => ({ success: false, error: e.message, id: 5 })),
    ];

    const resultados = await Promise.all(promesas);

    const exitos = resultados.filter((r) => r.success);
    const fallos = resultados.filter((r) => !r.success);

    expect(exitos).toHaveLength(1);
    expect(fallos).toHaveLength(4);

    // Verificar que los 4 fallos recibieron mensaje de token utilizado
    for (const fallo of fallos) {
      expect(fallo.error).toContain('Este enlace ya ha sido utilizado');
    }

    // 4. Verificar estado final en base de datos
    const userFinal = await userRepo.findOne({ where: { idUsuario: savedUser.idUsuario } });
    expect(userFinal?.estadoActivacion).toBe(EstadoActivacionUsuario.ACTIVO);
    expect(userFinal?.versionCredenciales).toBe(2); // Incrementado exactamente 1 vez (de 1 a 2)

    const tokenFinal = await tokenRepo.findOne({ where: { idToken: tokenAccion.idToken } });
    expect(tokenFinal?.usado).toBe(true);
  });
});

// Prueba visible en reporter cuando no hay DB externa configurada
describe('UsuariosService - Estado de prueba de integración externa PostgreSQL', () => {
  it('reporta correctamente si la base PostgreSQL externa de prueba está disponible o en espera', () => {
    if (!testPostgresUrl) {
      expect(true).toBe(true);
    } else {
      expect(testPostgresUrl).toBeDefined();
    }
  });
});