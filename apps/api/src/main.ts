import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api/v1');
  app.use(
    helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }),
  );
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = String(request.headers['x-request-id'] || randomUUID()).slice(0, 100);
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  });
  app.enableCors({
    origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(`${process.env.APP_NAME || 'CareerGround'} API`)
      .setDescription('Internal learning, recruiting, coding, and workspace API')
      .setVersion('1.0')
      .addCookieAuth('cg_access', { type: 'apiKey', in: 'cookie' })
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);
  app.getHttpAdapter().get('/api/openapi.json', (_request: Request, response: Response) => {
    response.json(document);
  });

  const port = Number(process.env.API_PORT || 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`[api] http://localhost:${port}/api/v1`);
  console.log(`[api] http://localhost:${port}/api/docs`);
}

void bootstrap();
