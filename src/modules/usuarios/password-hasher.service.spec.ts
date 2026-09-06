import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  let service: PasswordHasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordHasherService],
    }).compile();

    service = module.get<PasswordHasherService>(PasswordHasherService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('el hash generado no debe coincidir con el plaintext', async () => {
    const rawPassword = 'UnaClaveMuySegura123';
    const hash = await service.hash(rawPassword);

    expect(hash).not.toBe(rawPassword);
  });

  it('debe generar un hash con formato Argon2id', async () => {
    const hash = await service.hash('UnaClaveMuySegura123');

    expect(hash).toContain('$argon2id$');
  });

  it('debe verificar correctamente una contraseña válida', async () => {
    const rawPassword = 'UnaClaveMuySegura123';
    const hash = await service.hash(rawPassword);

    expect(await service.verify(hash, rawPassword)).toBe(true);
  });

  it('debe rechazar una contraseña incorrecta', async () => {
    const hash = await service.hash('UnaClaveMuySegura123');

    expect(await service.verify(hash, 'OtraClaveDistinta123')).toBe(false);
  });

  it('debe producir hashes distintos para la misma contraseña (salts aleatorios)', async () => {
    const password = 'UnaClaveMuySegura123';
    const hash1 = await service.hash(password);
    const hash2 = await service.hash(password);

    expect(hash1).not.toBe(hash2);
    expect(await service.verify(hash1, password)).toBe(true);
    expect(await service.verify(hash2, password)).toBe(true);
  });

  it('debe retornar false en lugar de lanzar error ante un hash corrupto o inválido', async () => {
    const resultado = await service.verify(
      'hash-no-valido',
      'UnaClaveMuySegura123',
    );
    expect(resultado).toBe(false);
  });
});
