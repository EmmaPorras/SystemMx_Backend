import { Test, TestingModule } from '@nestjs/testing';

import { CambiarEstadoUsuarioDto } from './dto/cambiar-estado-usuario.dto';
import { CambiarPasswordUsuarioDto } from './dto/cambiar-password-usuario.dto';
import { CambiarRolUsuarioDto } from './dto/cambiar-rol-usuario.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { RolUsuario } from './rol-usuario.enum';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

describe('UsuariosController', () => {
  let controller: UsuariosController;

  const mockUsuarioPublico = {
    idUsuario: 1,
    username: 'admin',
    nombre: 'Administrador',
    rol: RolUsuario.ADMIN,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const usuariosServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    crear: jest.fn(),
    cambiarEstado: jest.fn(),
    cambiarPassword: jest.fn(),
    cambiarRol: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        {
          provide: UsuariosService,
          useValue: usuariosServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('no debe exponer ningún método delete o remove', () => {
    const prototype = Object.getPrototypeOf(controller) as Record<
      string,
      unknown
    >;
    expect(prototype['remove']).toBeUndefined();
    expect(prototype['delete']).toBeUndefined();
  });

  describe('findAll', () => {
    it('debe delegar en usuariosService.findAll', async () => {
      usuariosServiceMock.findAll.mockResolvedValue([mockUsuarioPublico]);

      const resultado = await controller.findAll();

      expect(resultado).toEqual([mockUsuarioPublico]);
      expect(usuariosServiceMock.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('debe delegar en usuariosService.findOne con el id correspondiente', async () => {
      usuariosServiceMock.findOne.mockResolvedValue(mockUsuarioPublico);

      const resultado = await controller.findOne(1);

      expect(resultado).toEqual(mockUsuarioPublico);
      expect(usuariosServiceMock.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('crear', () => {
    it('debe delegar en usuariosService.crear con el DTO', async () => {
      const dto: CreateUsuarioDto = {
        username: 'operador1',
        nombre: 'Operador Uno',
        password: 'PasswordSegura123!',
        rol: RolUsuario.OPERADOR,
      };

      usuariosServiceMock.crear.mockResolvedValue({
        ...mockUsuarioPublico,
        username: 'operador1',
        rol: RolUsuario.OPERADOR,
      });

      const resultado = await controller.crear(dto);

      expect(resultado.rol).toBe(RolUsuario.OPERADOR);
      expect(usuariosServiceMock.crear).toHaveBeenCalledWith(dto);
    });
  });

  describe('cambiarEstado', () => {
    it('debe delegar en usuariosService.cambiarEstado', async () => {
      const dto: CambiarEstadoUsuarioDto = {
        activo: false,
      };

      usuariosServiceMock.cambiarEstado.mockResolvedValue({
        ...mockUsuarioPublico,
        activo: false,
      });

      const resultado = await controller.cambiarEstado(1, dto);

      expect(resultado.activo).toBe(false);
      expect(usuariosServiceMock.cambiarEstado).toHaveBeenCalledWith(1, false);
    });
  });

  describe('cambiarPassword', () => {
    it('debe delegar en usuariosService.cambiarPassword con la contraseña exacta', async () => {
      const dto: CambiarPasswordUsuarioDto = {
        password: 'NuevaPasswordSegura123!',
      };

      usuariosServiceMock.cambiarPassword.mockResolvedValue(mockUsuarioPublico);

      const resultado = await controller.cambiarPassword(1, dto);

      expect(resultado).toEqual(mockUsuarioPublico);
      expect(usuariosServiceMock.cambiarPassword).toHaveBeenCalledWith(
        1,
        dto.password,
      );
    });
  });

  describe('cambiarRol', () => {
    it('debe delegar en usuariosService.cambiarRol', async () => {
      const dto: CambiarRolUsuarioDto = {
        rol: RolUsuario.CONSULTA,
      };

      usuariosServiceMock.cambiarRol.mockResolvedValue({
        ...mockUsuarioPublico,
        rol: RolUsuario.CONSULTA,
      });

      const resultado = await controller.cambiarRol(1, dto);

      expect(resultado.rol).toBe(RolUsuario.CONSULTA);
      expect(usuariosServiceMock.cambiarRol).toHaveBeenCalledWith(
        1,
        RolUsuario.CONSULTA,
      );
    });
  });
});
