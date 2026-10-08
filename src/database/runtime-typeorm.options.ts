import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { detectDatabaseType } from './column-types';

export function createRuntimeTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const env: NodeJS.ProcessEnv = {
    DB_TYPE: config.get<string>('DB_TYPE'),
    DATABASE_URL: config.get<string>('DATABASE_URL'),
    DATABASE_URL_UNPOOLED: config.get<string>('DATABASE_URL_UNPOOLED'),
    DB_HOST: config.get<string>('DB_HOST'),
  };

  const dbType = detectDatabaseType(env);
  const databaseUrl = config.get<string>('DATABASE_URL');

  // Si se detecta PostgreSQL (por DATABASE_URL o DB_TYPE=postgres)
  if (dbType === 'postgres') {
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

    return {
      type: 'postgres',
      host: config.get<string>('DB_HOST') || 'localhost',
      port: Number(config.get<string>('DB_PORT') || 5432),
      username: config.getOrThrow<string>('DB_USERNAME'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      database: config.getOrThrow<string>('DB_DATABASE'),
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
      dropSchema: false,
      logging: config.get<string>('DB_LOGGING') === 'true',
    };
  }

  // De lo contrario, utilizar SQL Server (Desarrollo local por defecto o DB_TYPE=mssql)
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
      trustServerCertificate:
        config.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
    },

    extra: {
      requestTimeout: 60_000,
      connectionTimeout: 60_000,
    },
  };
}
