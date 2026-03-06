import { Body, Controller, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  create(@Body() body: { name: string; slug: string }) {
    return this.tenantService.create(body);
  }
}
