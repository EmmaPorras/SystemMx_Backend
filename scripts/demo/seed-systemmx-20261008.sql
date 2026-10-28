-- SystemMx: semilla ficticia para demostración. Solo usar en base comercial VACÍA, tras respaldo.

-- No modifica tabla usuario, credenciales ni migraciones.

-- Los datos DEMO no son comprobantes fiscales ni registros de transacciones reales.

-- STEP 01
INSERT INTO public.categoria(nombre,descripcion,activo) VALUES ('Cascos y protección','[DEMO] Categoría de ejemplo',true),('Accesorios del piloto','[DEMO] Categoría de ejemplo',true),('Frenos','[DEMO] Categoría de ejemplo',true),('Transmisión','[DEMO] Categoría de ejemplo',true),('Aceites y filtros','[DEMO] Categoría de ejemplo',true),('Sistema eléctrico','[DEMO] Categoría de ejemplo',true),('Iluminación y accesorios','[DEMO] Categoría de ejemplo',true),('Llantas y equipamiento','[DEMO] Categoría de ejemplo',true);

-- STEP 02
INSERT INTO public.tarifa_iva(codigo,descripcion,porcentaje,activo) VALUES ('EXENTO','Exento de IVA',0,true),('IVA13','Tarifa general',13,true),('IVA5','Tarifa reducida',5,true),('IVA2','Tarifa especial 2%',2,true);

-- STEP 03
INSERT INTO public.origen_compra(tipo_origen,nombre_referencia,contacto,observaciones,pais,moneda_preferida,telefono,correo,direccion,estado) VALUES ('Proveedor','Moto Pura Distribuciones','Departamento comercial','[DEMO] Empresa ficticia','Costa Rica','CRC','22221000','demo-1@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Repuestos Ruta 27','Departamento comercial','[DEMO] Empresa ficticia','Costa Rica','CRC','22221001','demo-2@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Accesorios Dos Ruedas','Departamento comercial','[DEMO] Empresa ficticia','Costa Rica','CRC','22221002','demo-3@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Importadora Central Moto','Departamento comercial','[DEMO] Empresa ficticia','Costa Rica','CRC','22221003','demo-4@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Comercial Moto Norte','Departamento comercial','[DEMO] Empresa ficticia','Costa Rica','CRC','22221004','demo-5@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Talleres y Repuestos Sur','Departamento comercial','[DEMO] Empresa ficticia','Costa Rica','CRC','22221005','demo-6@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Global Rider Supply','Departamento comercial','[DEMO] Empresa ficticia','Estados Unidos','USD','22221006','demo-7@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Motor Parts Warehouse','Departamento comercial','[DEMO] Empresa ficticia','Estados Unidos','USD','22221007','demo-8@example.com','Dirección ficticia','ACTIVO'),('Proveedor','American Motorcycle Gear','Departamento comercial','[DEMO] Empresa ficticia','Estados Unidos','USD','22221008','demo-9@example.com','Dirección ficticia','ACTIVO'),('Proveedor','Euro Moto Components','Departamento comercial','[DEMO] Empresa ficticia','España','EUR','22221009','demo-10@example.com','Dirección ficticia','ACTIVO');

-- STEP 04
INSERT INTO public.producto(id_categoria,id_tarifa_iva,nombre,descripcion,sku,precio_venta_sugerido_sin_iva,stock_minimo,activo,marca,variante,observaciones,costo_referencia) VALUES (1,2,'Casco integral negro','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-001',4850,8,true,'RiderPro','Universal','[DEMO] Producto ficticio',1310),(1,2,'Casco integral blanco','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-002',5900,8,true,'RiderPro','Universal','[DEMO] Producto ficticio',1720),(1,2,'Casco abatible touring','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-003',6950,8,true,'RiderPro','Universal','[DEMO] Producto ficticio',2130),(1,2,'Casco abierto urbano','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-004',8000,6,true,'RiderPro','Universal','[DEMO] Producto ficticio',2540),(2,2,'Guantes protección verano','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-005',9050,8,true,'MotoSafe','Universal','[DEMO] Producto ficticio',2950),(2,2,'Guantes impermeables','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-006',10100,8,true,'MotoSafe','Universal','[DEMO] Producto ficticio',3360),(2,1,'Chaqueta reflectiva','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-007',11150,8,true,'MotoSafe','Universal','[DEMO] Producto ficticio',3770),(2,2,'Chaleco impermeable','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-008',12200,6,true,'MotoSafe','Universal','[DEMO] Producto ficticio',4180),(3,2,'Pastillas freno delantero','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-009',13250,8,true,'Frenomax','Universal','[DEMO] Producto ficticio',4590),(3,2,'Pastillas freno trasero','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-010',3800,8,true,'Frenomax','Universal','[DEMO] Producto ficticio',900),(3,2,'Disco freno delantero','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-011',5500,8,true,'Frenomax','Universal','[DEMO] Producto ficticio',1310),(3,2,'Líquido de frenos DOT 4','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-012',6550,6,true,'Frenomax','Universal','[DEMO] Producto ficticio',1720),(4,2,'Cadena moto 428H','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-013',7600,8,true,'MotoChain','Universal','[DEMO] Producto ficticio',2130),(4,1,'Kit piñón y corona','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-014',8650,8,true,'MotoChain','Universal','[DEMO] Producto ficticio',2540),(4,2,'Lubricante de cadena','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-015',9700,8,true,'MotoChain','Universal','[DEMO] Producto ficticio',2950),(4,2,'Tensor de cadena','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-016',10750,6,true,'MotoChain','Universal','[DEMO] Producto ficticio',3360),(5,2,'Aceite motor 10W40','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-017',11800,8,true,'MaxFluid','Universal','[DEMO] Producto ficticio',3770),(5,2,'Aceite motor 20W50','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-018',12850,8,true,'MaxFluid','Universal','[DEMO] Producto ficticio',4180),(5,2,'Filtro de aceite','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-019',13900,8,true,'MaxFluid','Universal','[DEMO] Producto ficticio',4590),(5,2,'Filtro de aire deportivo','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-020',4450,6,true,'MaxFluid','Universal','[DEMO] Producto ficticio',900),(6,1,'Bujía iridio','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-021',6150,8,true,'ElectroMoto','Universal','[DEMO] Producto ficticio',1310),(6,2,'Bujía estándar','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-022',7200,8,true,'ElectroMoto','Universal','[DEMO] Producto ficticio',1720),(6,2,'Batería moto 12V','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-023',8250,8,true,'ElectroMoto','Universal','[DEMO] Producto ficticio',2130),(6,2,'Cable acelerador','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-024',9300,6,true,'ElectroMoto','Universal','[DEMO] Producto ficticio',2540),(7,2,'Bombillo LED H4','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-025',10350,8,true,'LumiRide','Universal','[DEMO] Producto ficticio',2950),(7,2,'Direccionales LED','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-026',11400,8,true,'LumiRide','Universal','[DEMO] Producto ficticio',3360),(7,2,'Faro auxiliar LED','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-027',12450,8,true,'LumiRide','Universal','[DEMO] Producto ficticio',3770),(7,1,'Luz de freno LED','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-028',13500,6,true,'LumiRide','Universal','[DEMO] Producto ficticio',4180),(7,2,'Espejos retrovisores','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-029',14550,8,true,'LumiRide','Universal','[DEMO] Producto ficticio',4590),(7,2,'Maniguetas ajustables','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-030',5100,8,true,'LumiRide','Universal','[DEMO] Producto ficticio',900),(7,2,'Puños antideslizantes','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-031',6800,8,true,'LumiRide','Universal','[DEMO] Producto ficticio',1310),(7,2,'Soporte para celular','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-032',7850,6,true,'LumiRide','Universal','[DEMO] Producto ficticio',1720),(8,2,'Llanta delantera 90/90','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-033',8900,8,true,'RoadGrip','Universal','[DEMO] Producto ficticio',2130),(8,2,'Llanta trasera 110/90','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-034',9950,8,true,'RoadGrip','Universal','[DEMO] Producto ficticio',2540),(8,1,'Cámara para llanta','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-035',11000,8,true,'RoadGrip','Universal','[DEMO] Producto ficticio',2950),(8,2,'Kit reparación pinchazos','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-036',12050,6,true,'RoadGrip','Universal','[DEMO] Producto ficticio',3360),(8,2,'Baúl trasero 32 litros','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-037',13100,8,true,'RoadGrip','Universal','[DEMO] Producto ficticio',3770),(8,2,'Candado de disco','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-038',14150,8,true,'RoadGrip','Universal','[DEMO] Producto ficticio',4180),(8,2,'Cobertor impermeable','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-039',15200,8,true,'RoadGrip','Universal','[DEMO] Producto ficticio',4590),(8,2,'Botas moto urbanas','[DEMO] Repuesto o accesorio de prueba','DEMO-MOTO-040',5750,6,true,'RoadGrip','Universal','[DEMO] Producto ficticio',900);

-- STEP 05
INSERT INTO public.pedido_compra(numero_pedido,nombre_pedido,id_origen_compra,fecha_pedido,fecha_recepcion,estado,inversion_total,costo_envio,impuestos_importacion,observaciones,pais_compra,moneda_compra,tipo_cambio,subtotal_productos,envio_interno,envio_casillero,otros_gastos,metodo_reparto_gastos,dias_duracion)
SELECT ord,'Pedido '||ord,oc.id_origen_compra,CURRENT_DATE-(88-ord*3),CASE WHEN ord<=12 THEN CURRENT_DATE-(83-ord*3) ELSE NULL END,
CASE WHEN ord<=12 THEN 'RECIBIDO' WHEN ord<=17 THEN 'EN_TRANSITO' ELSE 'REGISTRADO' END,0,0,0,
'[DEMO] Pedido ficticio',oc.pais,oc.moneda_preferida,CASE oc.moneda_preferida WHEN 'USD' THEN 514.0000 WHEN 'EUR' THEN 578.0000 ELSE 1.0000 END,
0,0,0,0,'SIN_GASTOS',CASE WHEN ord<=12 THEN 5 ELSE NULL END
FROM generate_series(1,20) ord JOIN public.origen_compra oc ON oc.id_origen_compra=((ord-1)%10)+1;

-- STEP 06
WITH ins AS (
 SELECT pc.id_pedido,p.id_producto,(18+((pc.numero_pedido+j)%6)*5)::int cantidad,
 pc.moneda_compra,pc.tipo_cambio,p.precio_venta_sugerido_sin_iva precio_sugerido,
 ROUND((900+(p.id_producto%10)*410)::numeric/pc.tipo_cambio,2) precio_origen
 FROM public.pedido_compra pc CROSS JOIN generate_series(1,3) j
 JOIN public.producto p ON p.sku='DEMO-MOTO-'||LPAD((((pc.numero_pedido-1)*3+j-1)%40+1)::text,3,'0')
)
INSERT INTO public.detalle_pedido_compra(id_pedido,id_producto,cantidad,moneda_origen,costo_unitario_origen,total_origen,tipo_cambio,total_colones,envio_asignado,impuestos_asignados,otros_gastos_asignados,costo_total_real,costo_unitario_real,precio_venta_sugerido,precio_venta_final,metodo_reparto_gastos,observaciones)
SELECT id_pedido,id_producto,cantidad,moneda_compra,precio_origen,ROUND(precio_origen*cantidad,2),tipo_cambio,ROUND(precio_origen*tipo_cambio*cantidad,2),0,0,0,
ROUND(precio_origen*tipo_cambio*cantidad,2),ROUND(precio_origen*tipo_cambio,2),precio_sugerido,NULL,'SIN_GASTOS','[DEMO] Línea de compra' FROM ins;

-- STEP 07
UPDATE public.pedido_compra pc SET subtotal_productos=q.total_origen,inversion_total=q.total_colones
FROM (SELECT id_pedido,SUM(total_origen) total_origen,SUM(total_colones) total_colones FROM public.detalle_pedido_compra GROUP BY id_pedido) q WHERE q.id_pedido=pc.id_pedido;

-- STEP 08
INSERT INTO public.lote_producto(id_pedido,id_producto,id_detalle_pedido,codigo_lote,cantidad_inicial,cantidad_recibida,cantidad_disponible,costo_unitario_real,precio_venta_recomendado,estado_lote,fecha_entrada,precio_venta_final,tipo_lote,costo_pendiente_al_vender,observaciones)
SELECT d.id_pedido,d.id_producto,d.id_detalle_pedido,
'L'||ROW_NUMBER() OVER(PARTITION BY d.id_pedido ORDER BY d.id_detalle_pedido),
d.cantidad,CASE WHEN pc.numero_pedido<=12 THEN d.cantidad WHEN pc.numero_pedido<=17 THEN FLOOR(d.cantidad*0.45)::int ELSE 0 END,
CASE WHEN pc.numero_pedido<=12 THEN d.cantidad WHEN pc.numero_pedido<=17 THEN FLOOR(d.cantidad*0.45)::int ELSE 0 END,
d.costo_unitario_real,d.precio_venta_sugerido,CASE WHEN pc.numero_pedido<=17 THEN 'EN_STOCK' ELSE 'EN_PROCESO' END,
CASE WHEN pc.numero_pedido<=17 THEN pc.fecha_pedido+5 ELSE NULL END,NULL,'COMPRA',0,'[DEMO] Lote por pedido'
FROM public.detalle_pedido_compra d JOIN public.pedido_compra pc ON pc.id_pedido=d.id_pedido;

-- STEP 09
INSERT INTO public.movimiento_inventario(id_producto,id_lote,fecha_movimiento,tipo_movimiento,cantidad,observaciones,referencia_tipo,referencia_id,id_usuario,usuario,motivo,costo_unitario,total_movimiento)
SELECT l.id_producto,l.id_lote,(l.fecha_entrada::timestamp+TIME '12:00') AT TIME ZONE 'America/Costa_Rica',
'ENTRADA_COMPRA',l.cantidad_recibida,'[DEMO] Recepción simulada','PEDIDO',l.id_pedido,NULL,'SYSTEM_DEMO','Recepción de mercancía por compra',l.costo_unitario_real,
ROUND(l.cantidad_recibida*l.costo_unitario_real,2)
FROM public.lote_producto l WHERE l.cantidad_recibida>0;

-- STEP 10
INSERT INTO public.venta(numero_venta,fecha_venta,cliente_nombre,medio_pago,estado_pago,estado_venta,subtotal,descuento_total,iva_total,total_venta,monto_pagado,saldo_pendiente,costo_total,ganancia_bruta,margen_bruto,fecha_entrega,fecha_vencimiento_pago,observaciones,en_papelera)
SELECT n,CURRENT_DATE-(37-n),'Cliente demostración '||LPAD(n::text,2,'0'),
CASE n%4 WHEN 0 THEN 'EFECTIVO' WHEN 1 THEN 'SINPE' WHEN 2 THEN 'TRANSFERENCIA' ELSE 'TARJETA' END,
CASE WHEN n<=23 THEN 'PAGADA' WHEN n<=30 THEN 'PARCIAL' ELSE 'EN_DEUDA' END,'REGISTRADA',
0,0,0,0,0,0,0,0,0,CURRENT_DATE-(37-n),
CASE WHEN n>=24 THEN CURRENT_DATE-(37-n)+CASE WHEN n%2=0 THEN 7 ELSE 25 END ELSE NULL END,
'[DEMO] Venta ficticia. No es una transacción real.',false
FROM generate_series(1,35) n;

-- STEP 11
WITH wanted AS (
SELECT v.id_venta,v.numero_venta,((v.numero_venta-1)%35+1)::int pid,(1+v.numero_venta%4)::int qty,1 linea FROM public.venta v
UNION ALL SELECT v.id_venta,v.numero_venta,((v.numero_venta+18)%36+1)::int pid,(1+v.numero_venta%2)::int qty,2 linea FROM public.venta v WHERE v.numero_venta<=20
), joined AS (
SELECT w.*,p.precio_venta_sugerido_sin_iva precio,l.id_lote,l.costo_unitario_real,t.id_tarifa_iva,t.porcentaje,
CASE WHEN w.linea=1 AND w.numero_venta%7=0 THEN 5 WHEN w.linea=2 AND w.numero_venta%8=0 THEN 10 ELSE 0 END porcentaje_desc,
CASE WHEN w.numero_venta%5=0 THEN 'MANUAL' ELSE 'FIFO' END modo
FROM wanted w JOIN public.producto p ON p.id_producto=w.pid
JOIN LATERAL (SELECT l.* FROM public.lote_producto l WHERE l.id_producto=w.pid AND l.cantidad_recibida>0 ORDER BY l.fecha_entrada,l.id_lote LIMIT 1) l ON true
JOIN public.tarifa_iva t ON t.id_tarifa_iva=CASE WHEN w.pid%8=0 THEN 1 WHEN w.pid%5=0 THEN 3 WHEN w.pid%9=0 THEN 4 ELSE 2 END
), amounts AS (
SELECT *,ROUND(qty*precio,2) sub,ROUND(ROUND(qty*precio,2)*porcentaje_desc/100,2) descuento FROM joined
), calc AS (
SELECT *,ROUND(sub-descuento,2) base,ROUND(ROUND(sub-descuento,2)*porcentaje/100,2) impuesto,
ROUND(qty*costo_unitario_real,2) costo FROM amounts
)
INSERT INTO public.detalle_venta(id_venta,id_producto,id_lote,cantidad,precio_unitario,subtotal,descuento,base_imponible,tipo_tarifa,id_tarifa_iva,porcentaje_iva,iva,total_linea,costo_unitario_real,costo_total,ganancia_bruta,modo_descuento_lote,detalle)
SELECT id_venta,pid,id_lote,qty,precio,sub,descuento,base,
CASE WHEN porcentaje=0 THEN 'EXENTO' WHEN porcentaje=13 THEN 'IVA' ELSE 'ESPECIAL' END,
id_tarifa_iva,porcentaje,impuesto,ROUND(base+impuesto,2),costo_unitario_real,costo,ROUND(base-costo,2),
modo,'[DEMO] Venta de producto ficticio' FROM calc;

-- STEP 12
WITH sales AS (
SELECT id_venta,SUM(subtotal) sub,SUM(descuento) descue,SUM(iva) iva,SUM(total_linea) total,SUM(costo_total) costo,SUM(ganancia_bruta) ganancia FROM public.detalle_venta GROUP BY id_venta
)
UPDATE public.venta v SET subtotal=q.sub,descuento_total=q.descue,iva_total=q.iva,total_venta=q.total,costo_total=q.costo,ganancia_bruta=q.ganancia,
margen_bruto=CASE WHEN q.sub-q.descue>0 THEN ROUND(q.ganancia/(q.sub-q.descue)*100,2) ELSE 0 END,
monto_pagado=CASE WHEN v.numero_venta<=23 THEN q.total WHEN v.numero_venta<=30 THEN ROUND(q.total*0.35,2) ELSE 0 END,
saldo_pendiente=CASE WHEN v.numero_venta<=23 THEN 0 WHEN v.numero_venta<=30 THEN q.total-ROUND(q.total*0.35,2) ELSE q.total END
FROM sales q WHERE q.id_venta=v.id_venta;

-- STEP 13
INSERT INTO public.pago_venta(id_venta,id_usuario,usuario,metodo_pago,monto,referencia,observaciones,created_at)
SELECT v.id_venta,NULL,'SYSTEM_DEMO',v.medio_pago,v.monto_pagado,
'DEMO-'||LPAD(v.numero_venta::text,4,'0'),'[DEMO] Cobro simulado; sin dinero real',
(v.fecha_venta::timestamp+TIME '15:00') AT TIME ZONE 'America/Costa_Rica'
FROM public.venta v WHERE v.monto_pagado>0;

-- STEP 14
UPDATE public.lote_producto l SET cantidad_disponible=l.cantidad_recibida-COALESCE(s.cantidad,0),
estado_lote=CASE WHEN l.cantidad_recibida=0 THEN 'EN_PROCESO'
WHEN l.cantidad_recibida-COALESCE(s.cantidad,0)=0 THEN 'AGOTADO'
WHEN COALESCE(s.cantidad,0)>0 THEN 'VENDIDO_PARCIAL' ELSE 'EN_STOCK' END
FROM (SELECT l2.id_lote,COALESCE(SUM(dv.cantidad),0)::int cantidad FROM public.lote_producto l2
LEFT JOIN public.detalle_venta dv ON dv.id_lote=l2.id_lote GROUP BY l2.id_lote) s
WHERE l.id_lote=s.id_lote;

-- STEP 15
INSERT INTO public.movimiento_inventario(id_producto,id_lote,fecha_movimiento,tipo_movimiento,cantidad,observaciones,referencia_tipo,referencia_id,id_usuario,usuario,motivo,costo_unitario,total_movimiento)
SELECT dv.id_producto,dv.id_lote,(v.fecha_venta::timestamp+TIME '16:00') AT TIME ZONE 'America/Costa_Rica',
'SALIDA_VENTA',dv.cantidad,'[DEMO] Venta simulada','VENTA',v.id_venta,NULL,'SYSTEM_DEMO',
'Salida de inventario por venta',dv.costo_unitario_real,dv.costo_total
FROM public.detalle_venta dv JOIN public.venta v ON v.id_venta=dv.id_venta;