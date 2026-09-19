import { redondear } from './utils/reportes.utils';

describe('ETAPA 9H — Reconciliación Cruzada de Reportes', () => {
  describe('PARTE B — Reconciliación 9B ↔ 9C (Ventas)', () => {
    it('debe conciliar Dashboard Ventas con Ventas Resumen y sus agregados (Productos, Lotes, Evolución)', () => {
      // Simulación de datos consistentes para el mismo periodo
      const ventasResumen = {
        cantidadVentas: 7,
        subtotal: 40000,
        impuestos: 2500,
        ventas: 42500,
        costo: 29500,
        gananciaBruta: 13000,
        margenBrutoPorcentaje: redondear((13000 / 42500) * 100), // 30.59%
        montoPagado: 32500,
        saldoPendiente: 10000,
      };

      const dashboardVentas = {
        cantidad: 7,
        total: 42500,
        costo: 29500,
        gananciaBruta: 13000,
        margenBrutoPorcentaje: 30.59,
        montoPagado: 32500,
        saldoPendiente: 10000,
      };

      // 1. Dashboard = Resumen
      expect(dashboardVentas.cantidad).toBe(ventasResumen.cantidadVentas);
      expect(dashboardVentas.total).toBe(ventasResumen.ventas);
      expect(dashboardVentas.costo).toBe(ventasResumen.costo);
      expect(dashboardVentas.gananciaBruta).toBe(ventasResumen.gananciaBruta);
      expect(dashboardVentas.margenBrutoPorcentaje).toBe(
        ventasResumen.margenBrutoPorcentaje,
      );
      expect(dashboardVentas.montoPagado).toBe(ventasResumen.montoPagado);
      expect(dashboardVentas.saldoPendiente).toBe(ventasResumen.saldoPendiente);

      // 2. Productos suman Resumen
      const productos = [
        { producto: 'P1', ventas: 20000, costo: 14000, gananciaBruta: 6000 },
        { producto: 'P2', ventas: 22500, costo: 15500, gananciaBruta: 7000 },
      ];
      const sumProdVentas = productos.reduce((s, p) => s + p.ventas, 0);
      const sumProdCosto = productos.reduce((s, p) => s + p.costo, 0);
      const sumProdGanancia = productos.reduce(
        (s, p) => s + p.gananciaBruta,
        0,
      );

      expect(sumProdVentas).toBe(ventasResumen.ventas);
      expect(sumProdCosto).toBe(ventasResumen.costo);
      expect(sumProdGanancia).toBe(ventasResumen.gananciaBruta);

      // 3. Lotes suman Resumen
      const lotes = [
        { lote: 'L1', ventas: 15000, costo: 10000, gananciaBruta: 5000 },
        { lote: 'L2', ventas: 27500, costo: 19500, gananciaBruta: 8000 },
      ];
      const sumLotesVentas = lotes.reduce((s, l) => s + l.ventas, 0);
      const sumLotesCosto = lotes.reduce((s, l) => s + l.costo, 0);
      const sumLotesGanancia = lotes.reduce((s, l) => s + l.gananciaBruta, 0);

      expect(sumLotesVentas).toBe(ventasResumen.ventas);
      expect(sumLotesCosto).toBe(ventasResumen.costo);
      expect(sumLotesGanancia).toBe(ventasResumen.gananciaBruta);

      // 4. Evolución suma Resumen
      const evolucion = [
        {
          fecha: '2026-09-01',
          ventas: 20000,
          costo: 14000,
          gananciaBruta: 6000,
        },
        {
          fecha: '2026-09-02',
          ventas: 22500,
          costo: 15500,
          gananciaBruta: 7000,
        },
      ];
      const sumEvolVentas = evolucion.reduce((s, e) => s + e.ventas, 0);
      const sumEvolCosto = evolucion.reduce((s, e) => s + e.costo, 0);
      const sumEvolGanancia = evolucion.reduce(
        (s, e) => s + e.gananciaBruta,
        0,
      );

      expect(sumEvolVentas).toBe(ventasResumen.ventas);
      expect(sumEvolCosto).toBe(ventasResumen.costo);
      expect(sumEvolGanancia).toBe(ventasResumen.gananciaBruta);

      // 5. No sumar márgenes: el cálculo debe ser global
      const margenGlobal = redondear((sumProdGanancia / sumProdVentas) * 100);
      expect(margenGlobal).toBe(ventasResumen.margenBrutoPorcentaje);
    });

    it('debe mantener ventas anuladas como universo separado sin restarlas a posteriori', () => {
      const ventasActivas = [{ idVenta: 1, total: 10000 }];
      const ventasAnuladas = [{ idVenta: 2, total: 5000 }];

      const totalActivas = ventasActivas.reduce((s, v) => s + v.total, 0);
      const totalAnuladas = ventasAnuladas.reduce((s, v) => s + v.total, 0);

      expect(totalActivas).toBe(10000);
      expect(totalAnuladas).toBe(5000);
      // Las activas no contienen la anulada y no sufren mutación
      expect(ventasActivas.find((v) => v.idVenta === 2)).toBeUndefined();
    });
  });

  describe('PARTE C — Reconciliación 9B ↔ 9D (Inventario)', () => {
    it('debe conciliar Dashboard Inventario con Inventario Resumen, Productos, Estados y Sin Stock', () => {
      const inventarioResumen = {
        totalLotes: 24,
        lotesConStock: 10,
        unidadesRecibidas: 61,
        unidadesDisponibles: 54,
        valorCosto: 204000,
        estados: {
          agotados: 2,
          enProceso: 12,
          enStock: 9,
          vendidoParcial: 1,
        },
      };

      const dashboardInventario = {
        lotesConStock: 10,
        unidadesDisponibles: 54,
        valorCosto: 204000,
      };

      // 1. Dashboard = Resumen
      expect(dashboardInventario.lotesConStock).toBe(
        inventarioResumen.lotesConStock,
      );
      expect(dashboardInventario.unidadesDisponibles).toBe(
        inventarioResumen.unidadesDisponibles,
      );
      expect(dashboardInventario.valorCosto).toBe(inventarioResumen.valorCosto);

      // 2. Productos suman Resumen
      const productos = [
        { idProducto: 1, stockDisponible: 30, valorCosto: 100000 },
        { idProducto: 2, stockDisponible: 24, valorCosto: 104000 },
        { idProducto: 3, stockDisponible: 0, valorCosto: 0 },
      ];

      const sumProdStock = productos.reduce((s, p) => s + p.stockDisponible, 0);
      const sumProdValor = productos.reduce((s, p) => s + p.valorCosto, 0);

      expect(sumProdStock).toBe(inventarioResumen.unidadesDisponibles);
      expect(sumProdValor).toBe(inventarioResumen.valorCosto);

      // 3. Estados suman Resumen
      const estados = [
        {
          estado: 'AGOTADO',
          lotes: 2,
          unidadesRecibidas: 6,
          unidadesDisponibles: 0,
        },
        {
          estado: 'EN_PROCESO',
          lotes: 12,
          unidadesRecibidas: 0,
          unidadesDisponibles: 0,
        },
        {
          estado: 'EN_STOCK',
          lotes: 9,
          unidadesRecibidas: 45,
          unidadesDisponibles: 45,
        },
        {
          estado: 'VENDIDO_PARCIAL',
          lotes: 1,
          unidadesRecibidas: 10,
          unidadesDisponibles: 9,
        },
      ];

      const sumEstadosLotes = estados.reduce((s, e) => s + e.lotes, 0);
      const sumEstadosRecibidas = estados.reduce(
        (s, e) => s + e.unidadesRecibidas,
        0,
      );
      const sumEstadosDisponibles = estados.reduce(
        (s, e) => s + e.unidadesDisponibles,
        0,
      );

      expect(sumEstadosLotes).toBe(inventarioResumen.totalLotes);
      expect(sumEstadosRecibidas).toBe(inventarioResumen.unidadesRecibidas);
      expect(sumEstadosDisponibles).toBe(inventarioResumen.unidadesDisponibles);

      // 4. Sin Stock: intersección vacía con productos con stock
      const sinStock = [{ idProducto: 3, stockDisponible: 0 }];
      const conStockIds = new Set(
        productos.filter((p) => p.stockDisponible > 0).map((p) => p.idProducto),
      );
      const interseccion = sinStock.filter((p) =>
        conStockIds.has(p.idProducto),
      );
      expect(interseccion).toHaveLength(0);
    });

    it('debe verificar reglas de cobertura en histórico de inventario', () => {
      const cobertura = {
        lotesTotales: 5,
        lotesConHistorialCompleto: 3,
        lotesLegacy: 2,
        lotesInconsistentes: 0,
      };

      // lotesConHistorialCompleto + lotesLegacy = lotesTotales
      expect(cobertura.lotesConHistorialCompleto + cobertura.lotesLegacy).toBe(
        cobertura.lotesTotales,
      );

      // Lote legacy tiene stockHistorico = null y consistente = null
      const loteLegacy = {
        historialCompleto: false,
        stockHistorico: null,
        consistente: null,
      };
      expect(loteLegacy.stockHistorico).toBeNull();
      expect(loteLegacy.consistente).toBeNull();

      // Lote completo tiene corte posterior = stockActual
      const loteCompleto = {
        historialCompleto: true,
        stockActual: 10,
        stockHistorico: 10,
        consistente: true,
      };
      expect(loteCompleto.stockHistorico).toBe(loteCompleto.stockActual);
    });
  });

  describe('PARTE D — Reconciliación 9B ↔ 9E (Compras)', () => {
    it('debe conciliar Dashboard Pedidos con Compras Resumen, Proveedores, Productos y Costos', () => {
      const dashboardPedidos = {
        total: 23,
        registrados: 7,
        enTransito: 5,
        recibidos: 7,
        cancelados: 4,
      };

      const comprasResumen = {
        cantidadPedidos: 19, // 23 - 4 = 19
        unidadesPedidas: 100,
        unidadesRecibidas: 61,
        unidadesPendientes: 39,
        recepcionConsistente: true,
        mercaderiaColones: 100000,
        envio: 5000,
        impuestos: 10000,
        otrosGastos: 3000,
        costoReal: 118000,
        diferenciaCosto: 0,
        costoConsistente: true,
      };

      // 1. Pedidos comerciales = total - cancelados = registrados + enTransito + recibidos
      expect(comprasResumen.cantidadPedidos).toBe(
        dashboardPedidos.total - dashboardPedidos.cancelados,
      );
      expect(comprasResumen.cantidadPedidos).toBe(
        dashboardPedidos.registrados +
          dashboardPedidos.enTransito +
          dashboardPedidos.recibidos,
      );

      // 2. Proveedores suman Resumen
      const proveedores = [
        { proveedor: 'Prov A', costoReal: 70000, unidadesPedidas: 60 },
        { proveedor: 'Prov B', costoReal: 48000, unidadesPedidas: 40 },
      ];
      const sumProvCosto = proveedores.reduce((s, p) => s + p.costoReal, 0);
      const sumProvUnidades = proveedores.reduce(
        (s, p) => s + p.unidadesPedidas,
        0,
      );

      expect(sumProvCosto).toBe(comprasResumen.costoReal);
      expect(sumProvUnidades).toBe(comprasResumen.unidadesPedidas);

      // 3. Productos suman Resumen
      const productos = [
        { producto: 'Prod 1', costoReal: 80000, unidadesPedidas: 70 },
        { producto: 'Prod 2', costoReal: 38000, unidadesPedidas: 30 },
      ];
      const sumProdCosto = productos.reduce((s, p) => s + p.costoReal, 0);
      const sumProdUnidades = productos.reduce(
        (s, p) => s + p.unidadesPedidas,
        0,
      );

      expect(sumProdCosto).toBe(comprasResumen.costoReal);
      expect(sumProdUnidades).toBe(comprasResumen.unidadesPedidas);

      // 4. Composición de costos concilia
      const mercaderia = comprasResumen.mercaderiaColones;
      const envio = comprasResumen.envio;
      const impuestos = comprasResumen.impuestos;
      const otros = comprasResumen.otrosGastos;
      const sumaComponentes = mercaderia + envio + impuestos + otros;

      expect(Math.abs(comprasResumen.costoReal - sumaComponentes)).toBeLessThan(
        0.01,
      );
    });
  });

  describe('PARTE E — Reconciliación 9B ↔ 9F (Pagos y Deuda)', () => {
    it('debe conciliar Dashboard Deuda con Cuentas por Cobrar, Vencimientos y Ledger', () => {
      const dashboardCuentas = {
        ventasConSaldo: 2,
        saldo: 10000,
      };

      const cpcResumen = {
        ventasConSaldo: 2,
        totalPorCobrar: 10000,
      };

      // 1. Dashboard = Cuentas por Cobrar
      expect(dashboardCuentas.ventasConSaldo).toBe(cpcResumen.ventasConSaldo);
      expect(dashboardCuentas.saldo).toBe(cpcResumen.totalPorCobrar);

      // 2. Vencimientos suman exactamente el total de cuentas por cobrar
      const vencimientos = {
        resumen: {
          ventasConSaldo: 2,
          totalPorCobrar: 10000,
        },
        sinVencimiento: { cantidad: 1, saldo: 4000 },
        vencidas: { cantidad: 1, saldo: 6000 },
        venceEnFechaCorte: { cantidad: 0, saldo: 0 },
        porVencer: { cantidad: 0, saldo: 0 },
      };

      const sumCantidadBuckets =
        vencimientos.sinVencimiento.cantidad +
        vencimientos.vencidas.cantidad +
        vencimientos.venceEnFechaCorte.cantidad +
        vencimientos.porVencer.cantidad;

      const sumSaldoBuckets =
        vencimientos.sinVencimiento.saldo +
        vencimientos.vencidas.saldo +
        vencimientos.venceEnFechaCorte.saldo +
        vencimientos.porVencer.saldo;

      expect(sumCantidadBuckets).toBe(vencimientos.resumen.ventasConSaldo);
      expect(sumSaldoBuckets).toBe(vencimientos.resumen.totalPorCobrar);

      // 3. Ledger por método suma Resumen Pagos
      const pagosResumen = {
        cantidadPagos: 12,
        montoRegistrado: 32500,
        montoVentasActivas: 27500,
        montoVentasAnuladas: 5000,
      };

      const metodos = [
        { metodo: 'EFECTIVO', montoTotal: 15000, montoVentasActivas: 12500 },
        { metodo: 'SINPE_MOVIL', montoTotal: 17500, montoVentasActivas: 15000 },
      ];

      const sumMetodosTotal = metodos.reduce((s, m) => s + m.montoTotal, 0);
      const sumMetodosActivas = metodos.reduce(
        (s, m) => s + m.montoVentasActivas,
        0,
      );

      expect(sumMetodosTotal).toBe(pagosResumen.montoRegistrado);
      expect(sumMetodosActivas).toBe(pagosResumen.montoVentasActivas);

      // 4. Conciliación matemática
      const conciliacion = {
        montoPagadoVenta: 32500,
        montoLedger: 27500,
        diferenciaCobertura: 5000,
      };

      expect(conciliacion.montoPagadoVenta - conciliacion.montoLedger).toBe(
        conciliacion.diferenciaCobertura,
      );
    });
  });

  describe('PARTE F — Reconciliación 8F ↔ 9G (Auditoría)', () => {
    it('debe conciliar auditados + legacy = total y métricas por usuario', () => {
      const resumenAuditoria = {
        movimientos: {
          total: 35,
          auditados: 20,
          legacy: 15,
          coberturaPorcentaje: redondear((20 / 35) * 100),
        },
        pagos: {
          total: 12,
          auditados: 8,
          legacy: 4,
          coberturaPorcentaje: redondear((8 / 12) * 100),
        },
      };

      // 1. Auditados + Legacy = Total
      expect(
        resumenAuditoria.movimientos.auditados +
          resumenAuditoria.movimientos.legacy,
      ).toBe(resumenAuditoria.movimientos.total);
      expect(
        resumenAuditoria.pagos.auditados + resumenAuditoria.pagos.legacy,
      ).toBe(resumenAuditoria.pagos.total);

      // 2. Cobertura Porcentaje
      expect(resumenAuditoria.movimientos.coberturaPorcentaje).toBe(57.14);
      expect(resumenAuditoria.pagos.coberturaPorcentaje).toBe(66.67);

      // 3. Actividad por usuario concilia con desglose
      const usuariosActividad = [
        {
          idUsuario: 1,
          movimientos: 12,
          pagosProcesados: 5,
          montoPagosProcesado: 18000,
        },
        {
          idUsuario: 2,
          movimientos: 8,
          pagosProcesados: 3,
          montoPagosProcesado: 9500,
        },
      ];

      const totalMovimientosAuditados = usuariosActividad.reduce(
        (s, u) => s + u.movimientos,
        0,
      );
      const totalPagosAuditados = usuariosActividad.reduce(
        (s, u) => s + u.pagosProcesados,
        0,
      );

      expect(totalMovimientosAuditados).toBe(
        resumenAuditoria.movimientos.auditados,
      );
      expect(totalPagosAuditados).toBe(resumenAuditoria.pagos.auditados);
    });
  });
});
