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

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get()
  finAll(@CurrentTenant() tenantId: string) {
    return this.customerService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.customerService.findOne(id, tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.create(dto, tenantId, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.update(id, dto, tenantId, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customerService.remove(id, tenantId, user.userId);
  }
}
