import { Test, TestingModule } from '@nestjs/testing';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

describe('PedidosController', () => {
  let controller: PedidosController;

  const pedidosServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    buscarProductosSugeridos: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    recibir: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        {
          provide: PedidosService,
          useValue: pedidosServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PedidosController>(PedidosController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('findAll debe delegar a service.findAll', async () => {
    const pedidos = [{ id: 1, numeroPedido: '100' }];
    pedidosServiceMock.findAll.mockResolvedValue(pedidos);

    const resultado = await controller.findAll();
    expect(pedidosServiceMock.findAll).toHaveBeenCalled();
    expect(resultado).toEqual(pedidos);
  });

  it('findOne debe delegar a service.findOne', async () => {
    const pedido = { id: 5, numeroPedido: '100' };
    pedidosServiceMock.findOne.mockResolvedValue(pedido);

    const resultado = await controller.findOne(5);
    expect(pedidosServiceMock.findOne).toHaveBeenCalledWith(5);
    expect(resultado).toEqual(pedido);
  });

  it('buscarProductosSugeridos debe delegar a service.buscarProductosSugeridos', async () => {
    const sugeridos = [{ id: 1, nombre: 'Filtro' }];
    pedidosServiceMock.buscarProductosSugeridos.mockResolvedValue(sugeridos);

    const resultado = await controller.buscarProductosSugeridos('filtro');
    expect(pedidosServiceMock.buscarProductosSugeridos).toHaveBeenCalledWith(
      'filtro',
    );
    expect(resultado).toEqual(sugeridos);
  });

  it('create debe delegar a service.create', async () => {
    const dto = { numeroPedido: 1 } as CreatePedidoDto;
    const pedidoCreado = { id: 1, numeroPedido: '1' };
    pedidosServiceMock.create.mockResolvedValue(pedidoCreado);

    const resultado = await controller.create(dto);
    expect(pedidosServiceMock.create).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(pedidoCreado);
  });

  it('update debe delegar a service.update', async () => {
    const dto = { observaciones: 'Actualizado' } as UpdatePedidoDto;
    const pedidoActualizado = { id: 5, observaciones: 'Actualizado' };
    pedidosServiceMock.update.mockResolvedValue(pedidoActualizado);

    const resultado = await controller.update(5, dto);
    expect(pedidosServiceMock.update).toHaveBeenCalledWith(5, dto);
    expect(resultado).toEqual(pedidoActualizado);
  });

  it('recibir debe delegar a service.recibir con usuario actor', async () => {
    const dto = {
      fechaRecepcion: '2026-09-06',
      detalles: [{ idLote: 10, cantidadRecibida: 5 }],
    };
    const usuarioMock = {
      idUsuario: 2,
      username: 'operador1',
      nombre: 'Operador Uno',
      rol: 'COMPRAS' as const,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const pedidoRecibido = { id: 5, estado: 'RECIBIDO' };
    pedidosServiceMock.recibir.mockResolvedValue(pedidoRecibido);

    const resultado = await controller.recibir(5, dto, usuarioMock);
    expect(pedidosServiceMock.recibir).toHaveBeenCalledWith(
      5,
      dto,
      usuarioMock,
    );
    expect(resultado).toEqual(pedidoRecibido);
  });

  it('remove debe delegar a service.remove', async () => {
    const respuesta = { message: 'Pedido cancelado correctamente.', id: 5 };
    pedidosServiceMock.remove.mockResolvedValue(respuesta);

    const resultado = await controller.remove(5);
    expect(pedidosServiceMock.remove).toHaveBeenCalledWith(5);
    expect(resultado).toEqual(respuesta);
  });
});
