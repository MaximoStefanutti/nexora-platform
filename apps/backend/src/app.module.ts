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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    TenantModule,
  ],
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
      )
      .forRoutes('*'); // aplica a todas las rutas excepto las excluidas
  }
}
