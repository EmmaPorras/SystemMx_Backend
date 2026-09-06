import { validate } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

describe('CreateUsuarioDto', () => {
  const crearDtoValido = (): CreateUsuarioDto => {
    const dto = new CreateUsuarioDto();
    dto.username = 'admin.taller';
    dto.nombre = 'Administrador General';
    dto.password = 'ClaveSegura12345';
    return dto;
  };

  it('debe ser válido con datos correctos', async () => {
    const dto = crearDtoValido();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('validaciones de username', () => {
    it('debe aceptar username de 3 caracteres simples ("abc")', async () => {
      const dto = crearDtoValido();
      dto.username = 'abc';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar username con guion bajo ("user_name")', async () => {
      const dto = crearDtoValido();
      dto.username = 'user_name';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar username con guion ("user-name")', async () => {
      const dto = crearDtoValido();
      dto.username = 'user-name';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar username menor a 3 caracteres ("ab")', async () => {
      const dto = crearDtoValido();
      dto.username = 'ab';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('debe rechazar username con espacios', async () => {
      const dto = crearDtoValido();
      dto.username = 'admin taller';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('debe rechazar username con caracteres no permitidos ("@")', async () => {
      const dto = crearDtoValido();
      dto.username = 'admin@taller';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('debe rechazar username mayor a 50 caracteres', async () => {
      const dto = crearDtoValido();
      dto.username = 'a'.repeat(51);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });
  });

  describe('validaciones de nombre', () => {
    it('debe aceptar nombre con 2 caracteres exactos', async () => {
      const dto = crearDtoValido();
      dto.nombre = 'Lu';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar nombre menor a 2 caracteres', async () => {
      const dto = crearDtoValido();
      dto.nombre = 'A';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
    });

    it('debe rechazar nombre mayor a 100 caracteres', async () => {
      const dto = crearDtoValido();
      dto.nombre = 'N'.repeat(101);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
    });
  });

  describe('validaciones de password', () => {
    it('debe aceptar contraseña de 12 caracteres exactos', async () => {
      const dto = crearDtoValido();
      dto.password = '123456789012';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar contraseña menor a 12 caracteres (11 caracteres)', async () => {
      const dto = crearDtoValido();
      dto.password = '12345678901';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('debe aceptar contraseña de 128 caracteres exactos', async () => {
      const dto = crearDtoValido();
      dto.password = 'P'.repeat(128);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar contraseña mayor a 128 caracteres (129 caracteres)', async () => {
      const dto = crearDtoValido();
      dto.password = 'P'.repeat(129);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });
});
