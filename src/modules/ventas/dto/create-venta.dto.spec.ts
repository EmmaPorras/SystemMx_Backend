import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateVentaDetalleDto, CreateVentaDto } from './create-venta.dto';

describe('CreateVentaDto & CreateVentaDetalleDto', () => {
  const crearDetalleValido = (
    overrides: Partial<CreateVentaDetalleDto> = {},
  ) => ({
    productoId: 1,
    cantidad: 2,
    precioUnitario: 5000,
    tipoTarifa: 'EXENTO',
    modoDescuentoLote: 'FIFO',
    ...overrides,
  });

  const crearVentaValida = (overrides: Partial<CreateVentaDto> = {}) => ({
    numeroVenta: 1001,
    fechaVenta: '2026-09-12',
    medioPago: 'EFECTIVO',
    detalles: [crearDetalleValido()],
    ...overrides,
  });

  it('debe ser válido con datos correctos', async () => {
    const dto = plainToInstance(CreateVentaDto, crearVentaValida());
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('numeroVenta', () => {
    it('debe aceptar límites válidos (1 y 999999)', async () => {
      const dtoMin = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ numeroVenta: 1 }),
      );
      expect(await validate(dtoMin)).toHaveLength(0);

      const dtoMax = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ numeroVenta: 999999 }),
      );
      expect(await validate(dtoMax)).toHaveLength(0);
    });

    it('debe rechazar 0, mayor a 999999 y decimales', async () => {
      const dtoCero = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ numeroVenta: 0 }),
      );
      expect((await validate(dtoCero)).length).toBeGreaterThan(0);

      const dtoExceso = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ numeroVenta: 1000000 }),
      );
      expect((await validate(dtoExceso)).length).toBeGreaterThan(0);

      const dtoDecimal = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ numeroVenta: 12.34 as unknown as number }),
      );
      expect((await validate(dtoDecimal)).length).toBeGreaterThan(0);
    });
  });

  describe('fechaVenta', () => {
    it('debe aceptar formato de fecha ISO', async () => {
      const dto = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ fechaVenta: '2026-09-12' }),
      );
      expect(await validate(dto)).toHaveLength(0);
    });

    it('debe rechazar fecha con formato inválido', async () => {
      const dto = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ fechaVenta: 'fecha-invalida' }),
      );
      expect((await validate(dto)).length).toBeGreaterThan(0);
    });
  });

  describe('clienteNombre', () => {
    it('debe aceptar omitido, vacío o hasta 100 caracteres', async () => {
      const dtoOmitido = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ clienteNombre: undefined }),
      );
      expect(await validate(dtoOmitido)).toHaveLength(0);

      const dtoVacio = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ clienteNombre: '' }),
      );
      expect(await validate(dtoVacio)).toHaveLength(0);

      const dtoMax = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ clienteNombre: 'A'.repeat(100) }),
      );
      expect(await validate(dtoMax)).toHaveLength(0);
    });

    it('debe rechazar más de 100 caracteres', async () => {
      const dtoExceso = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ clienteNombre: 'A'.repeat(101) }),
      );
      expect((await validate(dtoExceso)).length).toBeGreaterThan(0);
    });
  });

  describe('medioPago', () => {
    it('debe aceptar todos los medios permitidos', async () => {
      const permitidos = [
        'EFECTIVO',
        'SINPE',
        'TRANSFERENCIA',
        'TARJETA',
        'MIXTO',
        'OTRO',
      ];
      for (const medio of permitidos) {
        const dto = plainToInstance(
          CreateVentaDto,
          crearVentaValida({ medioPago: medio }),
        );
        expect(await validate(dto)).toHaveLength(0);
      }
    });

    it('debe rechazar medios de pago no permitidos', async () => {
      const dto = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ medioPago: 'CRYPTO' }),
      );
      expect((await validate(dto)).length).toBeGreaterThan(0);
    });
  });

  describe('detalles', () => {
    it('debe rechazar arreglo de detalles vacío', async () => {
      const dto = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ detalles: [] }),
      );
      expect((await validate(dto)).length).toBeGreaterThan(0);
    });

    it('debe validar cantidad en DetalleVenta (entero positivo)', async () => {
      const dtoOk = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ detalles: [crearDetalleValido({ cantidad: 10 })] }),
      );
      expect(await validate(dtoOk)).toHaveLength(0);

      const dtoCero = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ detalles: [crearDetalleValido({ cantidad: 0 })] }),
      );
      expect((await validate(dtoCero)).length).toBeGreaterThan(0);

      const dtoNegativo = plainToInstance(
        CreateVentaDto,
        crearVentaValida({ detalles: [crearDetalleValido({ cantidad: -1 })] }),
      );
      expect((await validate(dtoNegativo)).length).toBeGreaterThan(0);

      const dtoDecimal = plainToInstance(
        CreateVentaDto,
        crearVentaValida({
          detalles: [
            crearDetalleValido({ cantidad: 1.5 as unknown as number }),
          ],
        }),
      );
      expect((await validate(dtoDecimal)).length).toBeGreaterThan(0);
    });

    it('debe validar modoDescuentoLote (FIFO o MANUAL)', async () => {
      const dtoFifo = plainToInstance(
        CreateVentaDto,
        crearVentaValida({
          detalles: [crearDetalleValido({ modoDescuentoLote: 'FIFO' })],
        }),
      );
      expect(await validate(dtoFifo)).toHaveLength(0);

      const dtoManual = plainToInstance(
        CreateVentaDto,
        crearVentaValida({
          detalles: [
            crearDetalleValido({ modoDescuentoLote: 'MANUAL', loteId: 10 }),
          ],
        }),
      );
      expect(await validate(dtoManual)).toHaveLength(0);

      const dtoInvalido = plainToInstance(
        CreateVentaDto,
        crearVentaValida({
          detalles: [crearDetalleValido({ modoDescuentoLote: 'ALEATORIO' })],
        }),
      );
      expect((await validate(dtoInvalido)).length).toBeGreaterThan(0);
    });
  });
});
