import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  configureApp(app, configService);

  const port = Number(configService.get<string>('PORT') ?? 3000);
  await app.listen(port);

  console.log(`Backend corriendo en http://localhost:${port}/api`);
}

void bootstrap();
