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

@Controller('service')
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.serviceService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.serviceService.findOne(id, tenantId);
  }
  @Post()
  create(
    @Body() dto: CreateServiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.create(dto, tenantId, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.update(id, dto, tenantId, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.remove(id, tenantId, user.userId);
  }
}
