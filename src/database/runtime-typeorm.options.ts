import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createRuntimeTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mssql',

    host: config.getOrThrow<string>('DB_HOST'),

    port: Number(config.getOrThrow<string>('DB_PORT')),

    username: config.getOrThrow<string>('DB_USERNAME'),

    password: config.getOrThrow<string>('DB_PASSWORD'),

    database: config.getOrThrow<string>('DB_DATABASE'),

    entities: [__dirname + '/entities/*.entity{.ts,.js}'],

    synchronize: false,

    migrationsRun: false,

    dropSchema: false,

    logging: config.get<string>('DB_LOGGING') === 'true',

    options: {
      encrypt: config.get<string>('DB_ENCRYPT') === 'true',

      trustServerCertificate:
        config.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
    },

    extra: {
      requestTimeout: 60_000,

      connectionTimeout: 60_000,
    },
  };
}
