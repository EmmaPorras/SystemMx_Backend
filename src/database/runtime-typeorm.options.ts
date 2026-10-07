import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createRuntimeTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: config.getOrThrow<string>('DATABASE_URL'),

    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: config.get<string>('DB_LOGGING') === 'true',

    extra: {
      max: 10,
      connectionTimeoutMillis: 60_000,
    },
  };
}
