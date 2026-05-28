import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { UpdateServiceDto } from './dto/update-service.dto';

/**
 * Controller de gestión de servicios del tenant.
 * Todos los endpoints requieren autenticación JWT y contexto de tenant.
 *
 * Permisos:
 * - GET /service - cualquier miembro del tenant.
 * - GET /service/:id - cualquier miembro del tenant.
 * - POST /service - OWNER o ADMIN.
 * - PATCH /service/:id - OWNER o ADMIN.
 * - DELETE /service/:id - OWNER o ADMIN.
 */

@Controller('service')
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  /**
   * Lista todos los servicios del tenant ordenados por nombre.
   * GET /service
   */

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.serviceService.findAll(tenantId);
  }

  /**
   * Obtiene un servicio específico con contador de turnos asociados.
   * GET /service/:id
   */

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.serviceService.findOne(id, tenantId);
  }

  /**
   * Crea un servicio para el tenant.
   * POST /service
   */

  @Post()
  create(
    @Body() dto: CreateServiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.create(dto, tenantId, user.userId);
  }

  /**
   * Actualiza los datos de un servicio existente.
   * PATCH /service/:id
   */

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.update(id, dto, tenantId, user.userId);
  }

  /**
   * Elimina un servicio vía soft delete.
   * DELETE /service/:id
   */

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.remove(id, tenantId, user.userId);
  }
}
