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

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  /**
   * Lista todos los clientes del tenant con contador de turnos.
   * GET /customer
   */

  @Get()
  finAll(@CurrentTenant() tenantId: string) {
    return this.customerService.findAll(tenantId);
  }

  /**
   * Obtiene el detalle completo de un cliente específico.
   * GET /customer/:id
   */

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.customerService.findOne(id, tenantId);
  }

  /**
   * Crea unnuevo cliente en el tenant.
   * POST /customer
   */

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

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.remove(id, tenantId, user.userId);
  }
}
