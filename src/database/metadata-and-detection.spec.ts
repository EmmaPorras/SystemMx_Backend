import { DataSource } from 'typeorm';
import {
  detectDatabaseType,
  isSqlServer,
  isPostgres,
  resolveColumnType,
  resolveSqlExpr,
} from './column-types';

describe('Detecci�n Consistente de Motor de BD y Metadatos TypeORM', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('detectDatabaseType()', () => {
    it('detecta postgres cuando DB_TYPE=postgres o DB_TYPE=postgresql', () => {
      expect(detectDatabaseType({ DB_TYPE: 'postgres' })).toBe('postgres');
      expect(detectDatabaseType({ DB_TYPE: 'postgresql' })).toBe('postgres');
      expect(detectDatabaseType({ DB_TYPE: 'POSTGRES' })).toBe('postgres');
    });

    it('detecta mssql cuando DB_TYPE=mssql o DB_TYPE=sqlserver', () => {
      expect(detectDatabaseType({ DB_TYPE: 'mssql' })).toBe('mssql');
      expect(detectDatabaseType({ DB_TYPE: 'sqlserver' })).toBe('mssql');
    });

    it('detecta postgres cuando DATABASE_URL o DATABASE_URL_UNPOOLED est� configurada', () => {
      expect(
        detectDatabaseType({
          DATABASE_URL:
            'postgresql://user:pass@ep-cool.neon.tech/db?sslmode=require',
        }),
      ).toBe('postgres');

      expect(
        detectDatabaseType({
          DATABASE_URL_UNPOOLED:
            'postgres://user:pass@ep-cool.neon.tech/db?sslmode=require',
        }),
      ).toBe('postgres');
    });

    it('detecta mssql en desarrollo local con DB_HOST/DB_PORT sin DB_TYPE ni DATABASE_URL', () => {
      expect(
        detectDatabaseType({
          DB_HOST: 'localhost',
          DB_PORT: '1433',
          DB_USERNAME: 'inventario',
          DB_DATABASE: 'SystemMx',
        }),
      ).toBe('mssql');
    });

    it('por defecto sin variables retorna mssql', () => {
      expect(detectDatabaseType({})).toBe('mssql');
    });
  });

  describe('Carga real de metadatos con driver PostgreSQL', () => {
    it('inicializa metadatos de todas las entidades sin errores para PostgreSQL', async () => {
      let pgDs!: DataSource;

      jest.isolateModules(() => {
        process.env.DB_TYPE = 'postgres';
        delete process.env.DATABASE_URL;

        const { Usuario } = require('./entities/usuario.entity');
        const {
          TokenAccionUsuario,
        } = require('./entities/token-accion-usuario.entity');
        const { Categoria } = require('./entities/categoria.entity');
        const { Producto } = require('./entities/producto.entity');
        const { LoteProducto } = require('./entities/lote-producto.entity');
        const { OrigenCompra } = require('./entities/origen-compra.entity');
        const {
          PedidoCompraEntity,
        } = require('./entities/pedido-compra.entity');
        const {
          DetallePedidoCompra,
        } = require('./entities/detalle-pedido-compra.entity');
        const { VentaEntity } = require('./entities/venta.entity');
        const { DetalleVenta } = require('./entities/detalle-venta.entity');
        const { PagoVenta } = require('./entities/pago-venta.entity');
        const { TarifaIva } = require('./entities/tarifa-iva.entity');
        const {
          MovimientoInventario,
        } = require('./entities/movimiento-inventario.entity');

        const allEntities = [
          Usuario,
          TokenAccionUsuario,
          Categoria,
          Producto,
          LoteProducto,
          OrigenCompra,
          PedidoCompraEntity,
          DetallePedidoCompra,
          VentaEntity,
          DetalleVenta,
          PagoVenta,
          TarifaIva,
          MovimientoInventario,
        ];

        pgDs = new DataSource({
          type: 'postgres',
          entities: allEntities,
          synchronize: false,
        });
      });

      await pgDs.buildMetadatas();
      expect(pgDs.entityMetadatas.length).toBe(13);

      const userMeta = pgDs.entityMetadatas.find(
        (m) => m.tableName === 'usuario',
      );
      expect(userMeta).toBeDefined();

      const tokenMeta = pgDs.entityMetadatas.find(
        (m) => m.tableName === 'token_accion_usuario',
      );
      expect(tokenMeta).toBeDefined();
    });
  });

  describe('Carga real de metadatos con driver SQL Server (MSSQL)', () => {
    it('inicializa metadatos de todas las entidades sin errores para SQL Server (sin DB_TYPE, usando variables locales)', async () => {
      let msDs!: DataSource;

      jest.isolateModules(() => {
        delete process.env.DB_TYPE;
        delete process.env.DATABASE_URL;
        delete process.env.DATABASE_URL_UNPOOLED;
        process.env.DB_HOST = 'localhost';
        process.env.DB_PORT = '1433';
        process.env.DB_DATABASE = 'inventario_motos_dev';

        const { Usuario } = require('./entities/usuario.entity');
        const {
          TokenAccionUsuario,
        } = require('./entities/token-accion-usuario.entity');
        const { Categoria } = require('./entities/categoria.entity');
        const { Producto } = require('./entities/producto.entity');
        const { LoteProducto } = require('./entities/lote-producto.entity');
        const { OrigenCompra } = require('./entities/origen-compra.entity');
        const {
          PedidoCompraEntity,
        } = require('./entities/pedido-compra.entity');
        const {
          DetallePedidoCompra,
        } = require('./entities/detalle-pedido-compra.entity');
        const { VentaEntity } = require('./entities/venta.entity');
        const { DetalleVenta } = require('./entities/detalle-venta.entity');
        const { PagoVenta } = require('./entities/pago-venta.entity');
        const { TarifaIva } = require('./entities/tarifa-iva.entity');
        const {
          MovimientoInventario,
        } = require('./entities/movimiento-inventario.entity');

        const allEntities = [
          Usuario,
          TokenAccionUsuario,
          Categoria,
          Producto,
          LoteProducto,
          OrigenCompra,
          PedidoCompraEntity,
          DetallePedidoCompra,
          VentaEntity,
          DetalleVenta,
          PagoVenta,
          TarifaIva,
          MovimientoInventario,
        ];

        msDs = new DataSource({
          type: 'mssql',
          entities: allEntities,
          synchronize: false,
        });
      });

      await msDs.buildMetadatas();
      expect(msDs.entityMetadatas.length).toBe(13);

      const userMeta = msDs.entityMetadatas.find(
        (m) => m.tableName === 'usuario',
      );
      expect(userMeta).toBeDefined();

      const tokenMeta = msDs.entityMetadatas.find(
        (m) => m.tableName === 'token_accion_usuario',
      );
      expect(tokenMeta).toBeDefined();
    });
  });
});
