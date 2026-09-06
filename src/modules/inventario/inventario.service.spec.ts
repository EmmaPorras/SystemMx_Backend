import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import { LoteProducto } from '../../database/entities/lote-producto.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;

  const movimientoRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const managerMock = {
    getRepository: jest.fn(),
  };

  const crearLote = (overrides: Partial<LoteProducto> = {}): LoteProducto =>
    ({
      idLote: 10,
      idProducto: 6,
      costoUnitarioReal: 4000,
      ...overrides,
    }) as LoteProducto;

  beforeEach(async () => {
    jest.clearAllMocks();

    managerMock.getRepository.mockReturnValue(movimientoRepositoryMock);

    movimientoRepositoryMock.create.mockImplementation(
      (dto: Partial<MovimientoInventario>) => dto,
    );
    movimientoRepositoryMock.save.mockImplementation(
      (ent: Partial<MovimientoInventario>) =>
        Promise.resolve({ idMovimiento: 1, ...ent }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [InventarioService],
    }).compile();

    service = module.get<InventarioService>(InventarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registrarMovimiento', () => {
    it('23. Test ENTRADA_COMPRA genera referenciaTipo PEDIDO y calcula total', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      const resultado = await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 5,
          referenciaId: 30,
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith({
        idProducto: 6,
        idLote: 10,
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 5,
        referenciaTipo: 'PEDIDO',
        referenciaId: 30,
        usuario: null,
        motivo: 'Recepción de mercancía por compra',
        observaciones: null,
        costoUnitario: 4000,
        totalMovimiento: 20000,
      });
      expect(resultado).toBeDefined();
    });

    it('24. Test SALIDA_VENTA genera referenciaTipo VENTA', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 2,
          referenciaId: 50,
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 2,
          referenciaTipo: 'VENTA',
          referenciaId: 50,
          motivo: 'Salida de inventario por venta',
          totalMovimiento: 8000,
        }),
      );
    });

    it('25. Test REINGRESO_ANULACION_VENTA genera referenciaTipo VENTA', async () => {
      const lote = crearLote({
        idLote: 10,
        idProducto: 6,
        costoUnitarioReal: 4000,
      });

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 2,
          referenciaId: 50,
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 2,
          referenciaTipo: 'VENTA',
          referenciaId: 50,
          motivo: 'Reingreso de inventario por anulación de venta',
          totalMovimiento: 8000,
        }),
      );
    });

    it('26. Motivos predeterminados según tipo de movimiento', async () => {
      const lote = crearLote();

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        },
      );
      expect(movimientoRepositoryMock.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          motivo: 'Recepción de mercancía por compra',
        }),
      );

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'SALIDA_VENTA',
          cantidad: 1,
          referenciaId: 1,
        },
      );
      expect(movimientoRepositoryMock.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ motivo: 'Salida de inventario por venta' }),
      );

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'REINGRESO_ANULACION_VENTA',
          cantidad: 1,
          referenciaId: 1,
        },
      );
      expect(movimientoRepositoryMock.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          motivo: 'Reingreso de inventario por anulación de venta',
        }),
      );
    });

    it('27. Test motivo personalizado trimeado', async () => {
      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          motivo: '  Primera recepción parcial  ',
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: 'Primera recepción parcial' }),
      );
    });

    it('28. Test observaciones trimeadas', async () => {
      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          observaciones: '  Caja dañada  ',
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ observaciones: 'Caja dañada' }),
      );
    });

    it('29. Strings vacíos en usuario y observaciones se normalizan a null', async () => {
      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
          usuario: '   ',
          observaciones: '   ',
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario: null,
          observaciones: null,
        }),
      );
    });

    it('30. Cantidad 0 lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 0,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('31. Cantidad negativa lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: -5,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('32. Cantidad decimal (1.5) lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1.5,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('33. Lote inválido (idLote <= 0) lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ idLote: 0 }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ idLote: -1 }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('34. Producto inválido (idProducto <= 0) lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ idProducto: 0 }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ idProducto: -2 }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('35. Referencia inválida (referenciaId <= 0) lanza 400 BadRequestException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: -10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('36. Costo inválido (costoUnitarioReal < 0 o NaN) lanza 409 ConflictException', async () => {
      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ costoUnitarioReal: -1 }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.registrarMovimiento(managerMock as unknown as EntityManager, {
          lote: crearLote({ costoUnitarioReal: Number.NaN }),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('37. Costo como string retornado por el driver SQL parsea a número y calcula total', async () => {
      const lote = crearLote({
        costoUnitarioReal: '4000.50' as unknown as number,
      });

      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 2,
          referenciaId: 1,
        },
      );

      expect(movimientoRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          costoUnitario: 4000.5,
          totalMovimiento: 8001,
        }),
      );
    });

    it('38. Verifica que usa el repository de MovimientoInventario desde el EntityManager', async () => {
      await service.registrarMovimiento(
        managerMock as unknown as EntityManager,
        {
          lote: crearLote(),
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: 1,
          referenciaId: 1,
        },
      );

      expect(managerMock.getRepository).toHaveBeenCalledWith(
        MovimientoInventario,
      );
    });
  });
});
