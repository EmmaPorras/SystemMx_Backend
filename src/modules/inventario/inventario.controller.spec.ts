import { Test, TestingModule } from '@nestjs/testing';

import { ConsultaLotesDto } from './dto/consulta-lotes.dto';
import { ConsultaMovimientosDto } from './dto/consulta-movimientos.dto';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';

describe('InventarioController', () => {
  let controller: InventarioController;

  const inventarioServiceMock = {
    listarLotes: jest.fn(),
    buscarLotePorId: jest.fn(),
    listarLotesProducto: jest.fn(),
    listarMovimientos: jest.fn(),
    buscarMovimientoPorId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventarioController],
      providers: [
        {
          provide: InventarioService,
          useValue: inventarioServiceMock,
        },
      ],
    }).compile();

    controller = module.get<InventarioController>(InventarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listarLotes debe delegar a service.listarLotes', async () => {
    const dto: ConsultaLotesDto = { pagina: 1, limite: 10 };
    const resultadoMock = {
      items: [],
      total: 0,
      pagina: 1,
      limite: 10,
      totalPaginas: 0,
    };
    inventarioServiceMock.listarLotes.mockResolvedValue(resultadoMock);

    const resultado = await controller.listarLotes(dto);

    expect(inventarioServiceMock.listarLotes).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(resultadoMock);
  });

  it('listarLotesProducto debe delegar a service.listarLotesProducto', async () => {
    const dto: ConsultaLotesDto = { pagina: 1 };
    const resultadoMock = {
      items: [],
      total: 0,
      pagina: 1,
      limite: 50,
      totalPaginas: 0,
    };
    inventarioServiceMock.listarLotesProducto.mockResolvedValue(resultadoMock);

    const resultado = await controller.listarLotesProducto(6, dto);

    expect(inventarioServiceMock.listarLotesProducto).toHaveBeenCalledWith(
      6,
      dto,
    );
    expect(resultado).toEqual(resultadoMock);
  });

  it('buscarLote debe delegar a service.buscarLotePorId', async () => {
    const loteMock = { idLote: 10, codigoLote: 'L1' };
    inventarioServiceMock.buscarLotePorId.mockResolvedValue(loteMock);

    const resultado = await controller.buscarLote(10);

    expect(inventarioServiceMock.buscarLotePorId).toHaveBeenCalledWith(10);
    expect(resultado).toEqual(loteMock);
  });

  it('listarMovimientos debe delegar a service.listarMovimientos', async () => {
    const dto: ConsultaMovimientosDto = { tipoMovimiento: 'ENTRADA_COMPRA' };
    const resultadoMock = {
      items: [],
      total: 0,
      pagina: 1,
      limite: 50,
      totalPaginas: 0,
    };
    inventarioServiceMock.listarMovimientos.mockResolvedValue(resultadoMock);

    const resultado = await controller.listarMovimientos(dto);

    expect(inventarioServiceMock.listarMovimientos).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(resultadoMock);
  });

  it('buscarMovimiento debe delegar a service.buscarMovimientoPorId', async () => {
    const movMock = { idMovimiento: 1, tipoMovimiento: 'ENTRADA_COMPRA' };
    inventarioServiceMock.buscarMovimientoPorId.mockResolvedValue(movMock);

    const resultado = await controller.buscarMovimiento(1);

    expect(inventarioServiceMock.buscarMovimientoPorId).toHaveBeenCalledWith(1);
    expect(resultado).toEqual(movMock);
  });
});
