import { Test, TestingModule } from '@nestjs/testing';

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

  it('debe listar todas las ventas', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([]);
    const result = await controller.findAll('false', 'false');
    expect(service.findAll).toHaveBeenCalledWith({
      papelera: 'false',
      deudores: 'false',
    });
    expect(result).toEqual([]);
  });

  it('debe registrar un pago', async () => {
    const dto: RegistrarPagoVentaDto = {
      monto: 2000,
      metodoPago: 'SINPE',
      referencia: 'SINPE-123',
    };
    (service.registrarPago as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await controller.registrarPago(1, dto);
    expect(service.registrarPago).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual({ id: 1 });
  });

  it('debe listar pagos de una venta', async () => {
    (service.listarPagosVenta as jest.Mock).mockResolvedValue([]);
    const result = await controller.listarPagos(1);
    expect(service.listarPagosVenta).toHaveBeenCalledWith(1);
    expect(result).toEqual([]);
  });

  it('debe anular una venta', async () => {
    (service.anularVenta as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await controller.anularVenta(1);
    expect(service.anularVenta).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1 });
  });
});
