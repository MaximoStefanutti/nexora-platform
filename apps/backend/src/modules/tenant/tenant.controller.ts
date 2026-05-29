import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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

@ApiTags('Tenant')
@ApiBearerAuth('JWT')
@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  /**
   * Crea un nuevo teenant asignado al usuario actual como OWNER.
   * No requieree x-tenant-id porquee es una operación de creeación inicial.
   * POST /tenant
   */
  @ApiOperation({
    summary: 'Crear tenant',
    description: 'Creea un nuevo tenant y asigna al usuario actual como OWNER',
  })
  @ApiResponse({ status: 201, description: 'Tenant creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El slug ya está en uso' })
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
  @ApiOperation({
    summary: 'Buscar tenant por slug',
    description:
      'Retorna información pública del tenant. Usado en la pantalla de login del frontend',
  })
  @ApiResponse({ status: 200, description: 'Tenant encontrado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
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
  @ApiOperation({
    summary: 'Info del tenant actual',
    description:
      'Retorna información completa del tenant co ncontadores de miembros y servicios',
  })
  @ApiResponse({ status: 200, description: 'Infromación del tenant' })
  @ApiHeader({
    name: 'x-tenant-id',
    required: true,
    description: 'ID del tenant',
  })
  @Get('me')
  getMytenant(@CurrentTenant() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }
}
