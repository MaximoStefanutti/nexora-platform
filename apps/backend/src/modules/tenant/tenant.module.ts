import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

@Module({
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService], // Exportamos para que AuthMOdule pueda usarlo si lo necesita
})
export class TenantModule {}
