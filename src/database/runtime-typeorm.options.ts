import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createRuntimeTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>('DATABASE_URL');

  // Si existe DATABASE_URL, utilizar PostgreSQL / Neon (Render)
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
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

  // De lo contrario, utilizar SQL Server (Desarrollo local)
  return {
    type: 'mssql',

    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.getOrThrow<string>('DB_PORT')),
    username: config.getOrThrow<string>('DB_USERNAME'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_DATABASE'),

    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: config.get<string>('DB_LOGGING') === 'true',

    options: {
      encrypt: config.get<string>('DB_ENCRYPT') === 'true',
      trustServerCertificate: config.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
    },

    extra: {
      requestTimeout: 60_000,
      connectionTimeout: 60_000,
    },
  };
}
