import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  getUsers(@Body() dto: CreateUserDto) {
    return this.userService.findEmail(dto.email);
  }

  @Get('tenant')
  getUsersByTenant(@Body() dto: CreateUserDto) {
    return this.userService.findByTenant(dto.tenantId);
  }
}
