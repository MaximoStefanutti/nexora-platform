import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Controller de gestión de clientes (CRM).
 * Todos los endpoints requieren autenticación JWT y contexto tenant.
 *
 * Rutas disponibles:
 * - GET /customer - lista de clientes del tenant.
 * - GET /customer/:id - detalle de un cliente.
 * - POST /customer - crear cliente.
 * - PATCH /customer/:id - actualizar cliente.
 * - DELETE /customer/:id - eliminar cliente (soft delete).
 */
@ApiTags('Customer')
@ApiBearerAuth('JWT')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'ID del tenant',
})
@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  /**
   * Lista todos los clientes del tenant con contador de turnos.
   * GET /customer
   */
  @ApiOperation({
    summary: 'Listar clientes',
    description: 'Lista todos los clientes del tenant con contador de turnos',
  })
  @ApiResponse({ status: 200, description: 'Listar clientes' })
  @Get()
  finAll(@CurrentTenant() tenantId: string) {
    return this.customerService.findAll(tenantId);
  }

  /**
   * Obtiene el detalle completo de un cliente específico.
   * GET /customer/:id
   */
  @ApiOperation({
    summary: 'Obtener cliente',
    description: 'Retorna el detalle completo de un clinte',
  })
  @ApiResponse({ status: 200, description: 'Detalle del cliente' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.customerService.findOne(id, tenantId);
  }

  /**
   * Crea unnuevo cliente en el tenant.
   * POST /customer
   */
  @ApiOperation({
    summary: 'Crear cliente',
    description: 'Crea un nuevo cliente. El emial es único por tenant',
  })
  @ApiResponse({ status: 201, description: 'Cliente creado con exito' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un cliente con ese email en el tenant',
  })
  @Post()
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.create(dto, tenantId, user.userId);
  }

  /**
   * Actualiza los datos de un cliente existente.
   * PATCH /customer/:id
   */
  @ApiOperation({
    summary: 'Actualizar cliente',
    description: 'Actualiza los datos de un cliente existente',
  })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.update(id, dto, tenantId, user.userId);
  }

  /**
   * Elimina un cliente vía soft delete conservando su historial.
   * DELETE /customer/:id
   */
  @ApiOperation({
    summary: 'Eliminar cliente',
    description:
      'Elimina un cliente vía soft delete conservando historial de turnos',
  })
  @ApiResponse({ status: 200, description: 'Cliente eliminado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.remove(id, tenantId, user.userId);
  }
}
