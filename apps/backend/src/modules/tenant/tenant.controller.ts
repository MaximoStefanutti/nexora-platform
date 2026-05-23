import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateeTenantDto } from './dto/createe-tenant.dto';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  // Crearr tenant - cualquier usuario autenticado puede crear uno

  @Post()
  create(@Body() dto: CreateeTenantDto, @CurrentUser() user: AuthUser) {
    return this.tenantService.create(dto, user.userId);
  }

  // Buscar por slug - público para que el frontend pueda valida slugs
  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  // Info del tenant actual - requiere auth
  @Get('me')
  getMytenant(@CurrentTenant() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }
}
