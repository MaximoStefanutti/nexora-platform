import { Module } from '@nestjs/common';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import PrismaModule from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, TenantModule, UserModule, AuthModule, RoleModule],
})
export class AppModule {}
