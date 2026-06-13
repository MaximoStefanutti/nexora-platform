import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Booststrap');

  app.enableShutdownHooks();

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no declarados en el DTO
      forbidNonWhitelisted: true, // rechaza requests con campos extras
      transform: true, // transfoma tipos automáticos (string => number, etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  //Global Fliters
  app.useGlobalFilters(new PrismaExceptionFilter());

  //Helmet para seguridad HTTP headers
  app.use(
    helmet(
      process.env.NODE_ENV === 'production'
        ? {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'cdn.jsdelivr.net'],
                styleSrc: ["'self'", 'cdn.jsdelivr.net'],
                imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", 'cdn.jsdelivr.net'],
              },
            },
          }
        : undefined,
    ),
  );

  // Compression para respuestas más pequeñas
  app.use(compression());

  //CORS para el forntend Netx.js
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Nexora API')
      .setDescription(
        ` 
        ## API de Nexora platform

        SaaS multitenant para gestión de negocios de servicios.

        ### Autenticación
        Todos los endpoints protegidos requieeren un JWT Bearer token.
        Obtené tu token en **POST /auth/login**.
        
        ### Multitenancy
        Los endpoints de negocio requieren el header **x-tenant-id** con el ID del tenant.
        
        ### Módulos disponibles
        - **Auth** - Autenticación y sesiones
        - **Tenant** - Gestión de organizaciones
        - **Membership** - Gestión de miembros y roles
        - **User** - Gestión de miembtos y roles
        - **Service** - Catálogo de servicios
        - **Customer** - CRM de clientes
        - **Appointment** - Agenda y turnos
        - **Stats** - Dashboard de estadísticas`,
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrespa el JWT obtenido en POST /auth/login',
        },
        'JWt',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'x-tenant-id',
          description: 'ID del tenant al que pertence el request',
        },
        'x-tenant-id',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // mantien el token entre recargas
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log(
      `📚 Swagger disponible en http://localhost:${process.env.PORT}/api`,
    );
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
