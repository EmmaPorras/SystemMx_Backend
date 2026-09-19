import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const crearDtoValido = (): LoginDto => {
    const dto = new LoginDto();
    dto.username = 'admin';
    dto.password = 'ClaveSegura12345';
    return dto;
  };

  it('debe ser válido con username y password correctos', async () => {
    const dto = crearDtoValido();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('debe rechazar si username está vacío', async () => {
    const dto = crearDtoValido();
    dto.username = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
  });

  it('debe rechazar si username supera 50 caracteres', async () => {
    const dto = crearDtoValido();
    dto.username = 'u'.repeat(51);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
  });

  it('debe rechazar si password está vacía', async () => {
    const dto = crearDtoValido();
    dto.password = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('debe rechazar si password supera 128 caracteres', async () => {
    const dto = crearDtoValido();
    dto.password = 'p'.repeat(129);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
