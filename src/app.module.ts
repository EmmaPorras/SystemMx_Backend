import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriasModule } from './modules/categorias/categorias.module';
import { ProductosModule } from './modules/productos/productos.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { TarifasIvaModule } from './modules/tarifas/tarifas-iva.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),

        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        synchronize: false,
        logging: true,

        options: {
          encrypt: config.get<string>('DB_ENCRYPT') === 'true',
          trustServerCertificate:
            config.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
        },
      }),
    }),

    CategoriasModule,
    ProductosModule,
    ProveedoresModule,
    TarifasIvaModule,
  ],
})
export class AppModule {}