import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validateEnvironment } from './config/env.validation';
import { createRuntimeTypeOrmOptions } from './database/runtime-typeorm.options';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ProductosModule } from './modules/productos/productos.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { TarifasIvaModule } from './modules/tarifas/tarifas-iva.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createRuntimeTypeOrmOptions,
    }),

    CategoriasModule,
    ProductosModule,
    ProveedoresModule,
    TarifasIvaModule,
    PedidosModule,
    VentasModule,
    InventarioModule,
    UsuariosModule,
    AuthModule,
    ReportesModule,
    MailModule,
  ],
})
export class AppModule {}
