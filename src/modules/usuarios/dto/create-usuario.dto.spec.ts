import { validate } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';
import { RolUsuario } from '../rol-usuario.enum';

describe('CreateUsuarioDto', () => {
  const crearDtoValido = (): CreateUsuarioDto => {
    const dto = new CreateUsuarioDto();
    dto.username = 'admin.taller';
    dto.nombre = 'Administrador General';
    dto.password = 'ClaveSeguraSystemMx15';
    dto.rol = RolUsuario.ADMIN;
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

    it('debe rechazar username mayor a 50 caracteres', async () => {
      const dto = crearDtoValido();
      dto.username = 'a'.repeat(51);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('debe rechazar caracteres especiales no permitidos en username ("user@name")', async () => {
      const dto = crearDtoValido();
      dto.username = 'user@name';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('debe rechazar espacios en username ("user name")', async () => {
      const dto = crearDtoValido();
      dto.username = 'user name';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });
  });

  describe('validaciones de nombre', () => {
    it('debe aceptar nombre válido de 2 caracteres', async () => {
      const dto = crearDtoValido();
      dto.nombre = 'Al';
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
      dto.nombre = 'A'.repeat(101);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
    });
  });

  describe('validaciones de password (Fase 3 - Política de 15 a 128 caracteres)', () => {
    it('debe rechazar contraseña de 14 caracteres', async () => {
      const dto = crearDtoValido();
      dto.password = 'ClaveInsegur14'; // 14 caracteres
      expect(dto.password.length).toBe(14);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('debe aceptar contraseña de 15 caracteres exactos', async () => {
      const dto = crearDtoValido();
      dto.password = 'ClaveSegura15Ex';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar frase larga con espacios de más de 15 caracteres', async () => {
      const dto = crearDtoValido();
      dto.password = 'mi frase secreta larga y confiable';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar contraseña con Unicode y caracteres especiales', async () => {
      const dto = crearDtoValido();
      dto.password = 'ContraseñaSeguraConÑ_yTildes!';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar repetición continua de un único carácter', async () => {
      const dto = crearDtoValido();
      dto.password = 'a'.repeat(16);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('debe rechazar contraseña común trivial de diccionario', async () => {
      const dto = crearDtoValido();
      dto.password = 'password12345678';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('debe aceptar contraseña de 128 caracteres exactos', async () => {
      const dto = crearDtoValido();
      dto.password = 'ClaveSeguraSystemMx'.repeat(6) + '12345678901234'; // 19*6 + 14 = 128
      expect(dto.password.length).toBe(128);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar contraseña mayor a 128 caracteres (129 caracteres)', async () => {
      const dto = crearDtoValido();
      dto.password = 'ClaveSeguraSystemMx'.repeat(6) + '123456789012345'; // 129
      expect(dto.password.length).toBe(129);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });

  describe('validaciones de rol', () => {
    it('debe aceptar rol ADMIN', async () => {
      const dto = crearDtoValido();
      dto.rol = RolUsuario.ADMIN;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar rol VENTAS y COMPRAS', async () => {
      const dto = crearDtoValido();
      dto.rol = RolUsuario.VENTAS;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar rol CONSULTA', async () => {
      const dto = crearDtoValido();
      dto.rol = RolUsuario.CONSULTA;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar rol no reconocido / inventado', async () => {
      const dto = crearDtoValido();
      dto.rol = 'INVENTADO' as RolUsuario;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('rol');
    });

    it('debe rechazar si el rol es omitido', async () => {
      const dto = crearDtoValido();
      delete (dto as Partial<CreateUsuarioDto>).rol;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('rol');
    });
  });
});
