import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  getUsers(@CurrentUser() user: AuthUser) {
    return this.userService.findEmail(user.email);
  }

  @Get('tenant')
  getUsersByTenant(@CurrentTenant() dto: CreateUserDto) {
    return this.userService.findByTenant(dto.tenantId);
  }
}
