import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

/**
 * Controller dee gestión dee tenants.
 *
 * Rutas públicas:
 * -GET /tenant/slug/:slug - info pública del tenant para el login del frontend.
 *
 * Rutas protegidas:
 * - POST /tenant - crear nuevo tenant (cualquier usuario autnticado)
 * - GET /tenant/me - info del tenant actual con contadores.
 */

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  /**
   * Crea un nuevo teenant asignado al usuario actual como OWNER.
   * No requieree x-tenant-id porquee es una operación de creeación inicial.
   * POST /tenant
   */

  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: AuthUser) {
    return this.tenantService.create(dto, user.userId);
  }

  /**
   *Retorna información pública del tenant por slug
   * Usado por el frontend para mostrar el nombre del tenant en la pantalla del login
   * y para validar que el slug existe antes de intentar autenticarse.
   * GET /tenant/slug/:slug
   */

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  /**
   * Retorna información completa del tenant actual con contadores.
   * El tenantId se obtiene del JWT vía @CurrentTenant()
   * GET /tenant/me
   */

  @Get('me')
  getMytenant(@CurrentTenant() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }
}
