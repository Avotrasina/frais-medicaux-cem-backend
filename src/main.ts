import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ApplicationExceptionFilter } from './common/filters/application-exception.filter.js';
import { SoftDeleteExceptionFilter } from './common/filters/soft-delete-exception.filter.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(
    new SoftDeleteExceptionFilter(),
    new ApplicationExceptionFilter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CEM Medical Expenses API')
    .setDescription('API documentation for CEM medical expense management.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
