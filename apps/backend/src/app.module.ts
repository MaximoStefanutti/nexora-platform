import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // guard global - proteje todo salvo Public()
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'health', method: RequestMethod.GET },
        { path: 'tenant', method: RequestMethod.POST },
        { path: 'tenant/slug/:slug', method: RequestMethod.GET },
      )
      .forRoutes('*'); // aplica a todas las rutas excepto las excluidas
  }
}
