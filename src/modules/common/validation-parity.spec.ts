import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegistroDto } from '../auth/dto/registro.dto';
import { CreateCategoriaDto } from '../categorias/dto/create-categoria.dto';
import { CreatePedidoDto } from '../pedidos/dto/create-pedido.dto';
import { CreateProveedorDto } from '../proveedores/dto/create-proveedor.dto';
import { ConsultaInventarioHistoricoDto } from '../reportes/dto/consulta-inventario-historico.dto';
import { ConsultaPeriodoDto } from '../reportes/dto/consulta-periodo.dto';
import { CreateTarifaIvaDto } from '../tarifas/dto/create-tarifa-iva.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { RolUsuario } from '../usuarios/rol-usuario.enum';
import { CreateVentaDto } from '../ventas/dto/create-venta.dto';
import { RegistrarPagoVentaDto } from '../ventas/dto/registrar-pago-venta.dto';

describe('Validation Parity Contract Spec', () => {
  const validatorOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
  };

  describe('Human names and Unicode acceptance', () => {
    it('debe aceptar nombres humanos con tildes, ñ, diéresis y espacios en CreateUsuarioDto', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        username: 'juan.perez_99',
        nombre: 'José Peña Günther O’Connor',
        password: 'PassphraseSuperSegura2026!',
        rol: RolUsuario.CONSULTA,
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar nombres humanos y Unicode en RegistroDto', async () => {
      const dto = plainToInstance(RegistroDto, {
        nombre: 'María-José Peña Álvarez',
        username: 'mariajose.p',
        email: 'mariajose@dominio.com',
        password: 'FraseDePasoValida2026#Robusta',
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar acentos y caracteres comerciales en proveedores y categorías', async () => {
      const provDto = plainToInstance(CreateProveedorDto, {
        tipoOrigen: 'Proveedor',
        nombreReferencia: 'Distribuidora Peña & Hnos. S.A.',
        telefono: '+506 2222-3333',
        correo: 'contacto@distribuidorapena.cr',
        pais: 'Costa Rica',
        estado: 'ACTIVO',
      });

      const catDto = plainToInstance(CreateCategoriaDto, {
        nombre: 'Electrónica & Computación',
        descripcion: 'Componentes y periféricos para oficina y gaming',
      });

      const errorsProv = await validate(provDto, validatorOptions);
      const errorsCat = await validate(catDto, validatorOptions);

      expect(errorsProv.length).toBe(0);
      expect(errorsCat.length).toBe(0);
    });
  });

  describe('Rechazo de campos vacíos y espacios en blanco', () => {
    it('debe rechazar campos obligatorios vacíos o con solo espacios', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        username: '',
        nombre: '',
        password: '',
        rol: RolUsuario.CONSULTA,
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.length).toBeGreaterThanOrEqual(3);
      const propertyErrors = errors.map((e) => e.property);
      expect(propertyErrors).toContain('username');
      expect(propertyErrors).toContain('nombre');
      expect(propertyErrors).toContain('password');
    });

    it('debe rechazar username con caracteres prohibidos o espacios intermedios', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        username: 'usuario con espacios',
        nombre: 'Usuario Prueba',
        password: 'PassphraseSuperSegura2026!',
        rol: RolUsuario.CONSULTA,
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.some((e) => e.property === 'username')).toBe(true);
    });
  });

  describe('Rechazo de propiedades no autorizadas (Mass Assignment)', () => {
    it('debe rechazar payloads con campos extra no declarados en DTO', async () => {
      const dto = plainToInstance(CreateTarifaIvaDto, {
        codigo: 'IVA13',
        porcentaje: 13,
        descripcion: 'Impuesto al Valor Agregado 13%',
        estado: 'ACTIVA',
        campoInyectadoMalicioso: 'DROP TABLE tarifa_iva;',
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.some((e) => e.property === 'campoInyectadoMalicioso')).toBe(
        true,
      );
    });
  });

  describe('Rangos numéricos, moneda y decimales', () => {
    it('debe rechazar porcentajes de IVA menores a 0 o mayores a 100', async () => {
      const bajo = plainToInstance(CreateTarifaIvaDto, {
        codigo: 'IVAB',
        porcentaje: -1,
        descripcion: 'IVA Negativo',
        estado: 'ACTIVA',
      });
      const alto = plainToInstance(CreateTarifaIvaDto, {
        codigo: 'IVAA',
        porcentaje: 100.5,
        descripcion: 'IVA Excesivo',
        estado: 'ACTIVA',
      });

      const errorsBajo = await validate(bajo, validatorOptions);
      const errorsAlto = await validate(alto, validatorOptions);

      expect(errorsBajo.some((e) => e.property === 'porcentaje')).toBe(true);
      expect(errorsAlto.some((e) => e.property === 'porcentaje')).toBe(true);
    });

    it('debe rechazar pagos de venta menores o iguales a 0', async () => {
      const pagoCero = plainToInstance(RegistrarPagoVentaDto, {
        monto: 0,
        metodoPago: 'EFECTIVO',
      });
      const pagoNegativo = plainToInstance(RegistrarPagoVentaDto, {
        monto: -500,
        metodoPago: 'EFECTIVO',
      });

      const errorsCero = await validate(pagoCero, validatorOptions);
      const errorsNeg = await validate(pagoNegativo, validatorOptions);

      expect(errorsCero.some((e) => e.property === 'monto')).toBe(true);
      expect(errorsNeg.some((e) => e.property === 'monto')).toBe(true);
    });
  });

  describe('Validación estricta de fechas y formatos ISO', () => {
    it('debe aceptar fechas válidas YYYY-MM-DD en reportes', async () => {
      const dto = plainToInstance(ConsultaPeriodoDto, {
        fechaDesde: '2026-01-01',
        fechaHasta: '2026-12-31',
      });
      const errors = await validate(dto, validatorOptions);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar formatos de fecha inválidos', async () => {
      const dto = plainToInstance(ConsultaInventarioHistoricoDto, {
        fechaCorte: '01/01/2026',
      });
      const errors = await validate(dto, validatorOptions);
      expect(errors.some((e) => e.property === 'fechaCorte')).toBe(true);
    });
  });

  describe('Arreglos y validación anidada', () => {
    it('debe rechazar pedidos con arreglos de detalle vacíos', async () => {
      const dto = plainToInstance(CreatePedidoDto, {
        fecha: '2026-10-27',
        origen: 'San José',
        proveedorId: 1,
        monedaCompra: 'CRC',
        tipoCambio: 1,
        estado: 'REGISTRADO',
        detalles: [],
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.some((e) => e.property === 'detalles')).toBe(true);
    });

    it('debe rechazar ventas con arreglos de detalle vacíos', async () => {
      const dto = plainToInstance(CreateVentaDto, {
        fechaVenta: '2026-10-27',
        medioPago: 'EFECTIVO',
        detalles: [],
      });

      const errors = await validate(dto, validatorOptions);
      expect(errors.some((e) => e.property === 'detalles')).toBe(true);
    });
  });
});
