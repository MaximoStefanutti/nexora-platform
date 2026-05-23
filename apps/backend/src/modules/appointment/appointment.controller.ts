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

@Controller('appointment')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.appointmentService.findAll(tenantId);
  }

  @Get('by-date')
  findByDate(@CurrentTenant() tenantId: string, @Query('date') date: string) {
    return this.appointmentService.findByDate(tenantId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.appointmentService.findOne(id, tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.create(dto, tenantId, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.update(id, dto, tenantId, user.userId);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentService.canceld(id, tenantId, user.userId);
  }
}
