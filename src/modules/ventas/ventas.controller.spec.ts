import { Test, TestingModule } from '@nestjs/testing';

import { CreateVentaDto } from './dto/create-venta.dto';
import { RegistrarPagoVentaDto } from './dto/registrar-pago-venta.dto';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

describe('VentasController', () => {
  let controller: VentasController;
  let service: jest.Mocked<Partial<VentasService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      registrarPago: jest.fn(),
      listarPagosVenta: jest.fn(),
      enviarAPapelera: jest.fn(),
      restaurarDePapelera: jest.fn(),
      anularVenta: jest.fn(),
      obtenerInventarioDisponible: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VentasController],
      providers: [
        {
          provide: VentasService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<VentasController>(VentasController);
  });

  it('debe listar todas las ventas con filtros', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([]);
    const result = await controller.findAll('false', 'false');
    expect(service.findAll).toHaveBeenCalledWith({
      papelera: 'false',
      deudores: 'false',
    });
    expect(result).toEqual([]);
  });

  it('debe obtener inventario disponible', async () => {
    (service.obtenerInventarioDisponible as jest.Mock).mockResolvedValue([]);
    const result = await controller.obtenerInventarioDisponible();
    expect(service.obtenerInventarioDisponible).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('debe obtener una venta por ID', async () => {
    (service.findOne as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1 });
  });

  const mockUsuario = {
    idUsuario: 2,
    username: 'operador1',
    nombre: 'Operador Uno',
    rol: 'OPERADOR' as const,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('debe crear una nueva venta', async () => {
    const dto: CreateVentaDto = {
      numeroVenta: 1001,
      fechaVenta: '2026-09-12',
      medioPago: 'EFECTIVO',
      detalles: [
        {
          productoId: 1,
          cantidad: 2,
          precioUnitario: 5000,
          tipoTarifa: 'EXENTO',
        },
      ],
    };
    (service.create as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await controller.create(dto, mockUsuario);
    expect(service.create).toHaveBeenCalledWith(dto, mockUsuario);
    expect(result).toEqual({ id: 1 });
  });

  it('debe registrar un pago', async () => {
    const dto: RegistrarPagoVentaDto = {
      monto: 2000,
      metodoPago: 'SINPE',
      referencia: 'SINPE-123',
    };
    (service.registrarPago as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await controller.registrarPago(1, dto, mockUsuario);
    expect(service.registrarPago).toHaveBeenCalledWith(1, dto, mockUsuario);
    expect(result).toEqual({ id: 1 });
  });

  it('debe listar pagos de una venta', async () => {
    (service.listarPagosVenta as jest.Mock).mockResolvedValue([]);
    const result = await controller.listarPagos(1);
    expect(service.listarPagosVenta).toHaveBeenCalledWith(1);
    expect(result).toEqual([]);
  });

  it('debe enviar una venta a la papelera', async () => {
    (service.enviarAPapelera as jest.Mock).mockResolvedValue({
      id: 1,
      enPapelera: true,
    });
    const result = await controller.enviarAPapelera(1);
    expect(service.enviarAPapelera).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, enPapelera: true });
  });

  it('debe restaurar una venta de la papelera', async () => {
    (service.restaurarDePapelera as jest.Mock).mockResolvedValue({
      id: 1,
      enPapelera: false,
    });
    const result = await controller.restaurarDePapelera(1);
    expect(service.restaurarDePapelera).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, enPapelera: false });
  });

  it('debe anular una venta', async () => {
    (service.anularVenta as jest.Mock).mockResolvedValue({
      id: 1,
      estadoVenta: 'ANULADA',
    });
    const result = await controller.anularVenta(1, mockUsuario);
    expect(service.anularVenta).toHaveBeenCalledWith(1, mockUsuario);
    expect(result).toEqual({ id: 1, estadoVenta: 'ANULADA' });
  });
});
