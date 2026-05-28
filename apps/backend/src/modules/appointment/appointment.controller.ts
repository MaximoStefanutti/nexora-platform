import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

/**
 * Controller de gestión de turnos.
 * Todos los endpoints requieren autenticación JWT y contexto de tenant.
 *
 * Rutas disponibles:
 * - GET /appointment - lista todos los turnos del tenant.
 * - GET /appointment/by-date?date=YYYY-MM-DD - turnos de un día específico.
 * - GET /appointment/:id - detalle de un turno.
 * - POST /appointment - crear turno
 * - PATCH /appointment/:id - actualizar estado o notas.
 * - PATCH /appointment/:id/cancel - cancelar turno.
 */

@Controller('appointment')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  /**
   * Lista todos los turnos del tenant ordenados por fecha.
   * GET /appointment
   */

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.appointmentService.findAll(tenantId);
  }

  /**
   * Lista los turnos de un día específico excluyendo cancelados.
   * Usado para la vista de agenda diaria.
   * GET /appointment/by-date?date=2026-05-27
   */

  @Get('by-date')
  findByDate(@CurrentTenant() tenantId: string, @Query('date') date: string) {
    return this.appointmentService.findByDate(tenantId, date);
  }

  /**
   * Obtiene el detalle completo de un turno específico.
   * GET /appointment/:id
   */

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.appointmentService.findOne(id, tenantId);
  }

  /**
   * Crea un nuevo turno con validaciones disponibles.
   * POST /appointment
   */

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.create(dto, tenantId, user.userId);
  }

  /**
   * Actualiza el estado o notas de un turno.
   * PATCH /appointment/:id
   */

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.update(id, dto, tenantId, user.userId);
  }

  /**
   * Cancela un turno cmabiando su estado a CACELLED.
   * PATCH /appointment/:id/cancel
   */

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.cancel(id, tenantId, user.userId);
  }
}
