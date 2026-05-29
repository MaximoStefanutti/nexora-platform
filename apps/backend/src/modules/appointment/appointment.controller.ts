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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
@ApiTags('Appointment')
@ApiBearerAuth('JWT')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'ID del tenant',
})
@Controller('appointment')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  /**
   * Lista todos los turnos del tenant ordenados por fecha.
   * GET /appointment
   */
  @ApiOperation({
    summary: 'Listar turnos',
    description: 'Lista todos los turnos del tenant',
  })
  @ApiResponse({ status: 200, description: 'Listar turnos' })
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.appointmentService.findAll(tenantId);
  }

  /**
   * Lista los turnos de un día específico excluyendo cancelados.
   * Usado para la vista de agenda diaria.
   * GET /appointment/by-date?date=2026-05-27
   */
  @ApiOperation({
    summary: 'Turnos por fecha',
    description:
      'Lista los turnos de un día específico excluyendo los cancelados. Usado para la agenda diaria',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-05-29',
    description: 'Fecha en formato YYYY-MM-DD',
  })
  @ApiResponse({ status: 200, description: 'Turnos del día' })
  @Get('by-date')
  findByDate(@CurrentTenant() tenantId: string, @Query('date') date: string) {
    return this.appointmentService.findByDate(tenantId, date);
  }

  /**
   * Obtiene el detalle completo de un turno específico.
   * GET /appointment/:id
   */
  @ApiOperation({
    summary: 'Obtener turno',
    description: 'Retorna el detalle completo de un turno especifico',
  })
  @ApiResponse({ status: 200, description: 'Detalle del turno' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.appointmentService.findOne(id, tenantId);
  }

  /**
   * Crea un nuevo turno con validaciones disponibles.
   * POST /appointment
   */
  @ApiOperation({
    summary: 'Crear turno',
    description:
      'Crea un nuevo turno validando disponibilidad de staff y cliente. El endTime se calcula automáticamente.',
  })
  @ApiResponse({ status: 201, description: 'Turno creado exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Servicio, cliente o staff no encontrado',
  })
  @ApiResponse({ status: 409, description: 'Solapamiento de horarios' })
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
  @ApiOperation({
    summary: 'Actualiza turno',
    description:
      'Actualiza el estado o notas de un turno. Solo el staff asignado o ADMIN/OWNER',
  })
  @ApiResponse({ status: 200, description: 'Turno actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para modificar el turno',
  })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
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
  @ApiOperation({
    summary: 'Cancelar turno',
    description: 'Cancela un turno cambiando su estado a CANCELLED',
  })
  @ApiResponse({ status: 200, description: 'Turno cancelado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para cancelar el turno',
  })
  @ApiResponse({ status: 409, description: 'El turno ya está cancelado' })
  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.cancel(id, tenantId, user.userId);
  }
}
