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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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

@ApiTags('Service')
@ApiBearerAuth('JWT')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'ID del tenant',
})
@Controller('service')
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  /**
   * Lista todos los servicios del tenant ordenados por nombre.
   * GET /service
   */
  @ApiOperation({
    summary: 'Lista servicios',
    description: 'Lista todos los servicios de un tenant',
  })
  @ApiResponse({ status: 200, description: 'Lista de servicios' })
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.serviceService.findAll(tenantId);
  }

  /**
   * Obtiene un servicio específico con contador de turnos asociados.
   * GET /service/:id
   */
  @ApiOperation({
    summary: 'Obtener servicio',
    description:
      'Retorna el detalle y con tador de turnos asociado a un servicio específico',
  })
  @ApiResponse({ status: 200, description: 'Detalle del servicio' })
  @ApiResponse({ status: 403, description: 'Servicio no encontrado' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.serviceService.findOne(id, tenantId);
  }

  /**
   * Crea un servicio para el tenant.
   * POST /service
   */
  @ApiOperation({
    summary: 'Crear un servicio',
    description:
      'Creea un nuevo servicio. Solo OWNER o ADMIN pueden crear servicios',
  })
  @ApiResponse({ status: 200, description: 'Servicio creado exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'Solo OWNER o ADMIN pueden crear servicios',
  })
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
  @ApiOperation({
    summary: 'Actualizar servicio',
    description: 'Actualiza los datos de un servicio existente',
  })
  @ApiResponse({ status: 200, description: 'Servico actualizado' })
  @ApiResponse({ status: 404, description: 'Servico no encontrado' })
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
  @ApiOperation({
    summary: 'Eliminar servicio',
    description: 'Elimina un servicio vía soft delete',
  })
  @ApiResponse({ status: 200, description: 'Servicio eliminado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.remove(id, tenantId, user.userId);
  }
}
