import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import PrismaModule from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { CommonModule } from './common/common.module';
import { MembershipModule } from './modules/membership/membership.module';
import { ServiceModule } from './modules/service/service.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { AppController } from './app.controller';
import { StatsModule } from './modules/stats/stats.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Valida las variables de entorno al arrancar. Si falta algo crítico
      // (ej: JWT_ACCESS_SECRET), la app NO arranca. `abortEarly: false`
      // muestra todos los errores juntos en vez de uno por uno.
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    // Rate limiting global: 100 requests por minuto por IP por defecto.
    // Los endpoints sensibles (login/register/refresh) tienen un límite
    // más estricto vía @Throttle() en su controller.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // ventana de 60 segundos
        limit: 100, // máximo de requests por ventana
      },
    ]),
    PrismaModule,
    CommonModule,
    AuthModule,
    UserModule,
    TenantModule,
    MembershipModule,
    ServiceModule,
    CustomerModule,
    AppointmentModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      // Guard de rate limiting aplicado globalmente.
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // guard global - protege todo salvo Public()
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST },
        { path: 'health', method: RequestMethod.GET },
        { path: 'tenant', method: RequestMethod.POST },
        { path: 'tenant/slug/:slug', method: RequestMethod.GET },
      )
      .forRoutes('*'); // aplica a todas las rutas excepto las excluidas
  }
}
