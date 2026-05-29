import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Controller de gestión de usuarios.
 * Todos los endpoints requieren autenticación JWT.
 *
 *
 * Rutas disponibles:
 * - POST /user - crear usuario (OWNER o ADMIN).
 * - GET /user/me - datos del usuario autenticado actual.
 * - GET /user/tenant - lista de usuarios del tenant actual.
 */
@ApiTags('User')
@ApiBearerAuth('JWT')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Crea un nuevo usuario en el sistema.
   * Requiere rol OWNER o ADMIN en el tenant actual.
   * POST /user
   */
  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Crea un nuevo usuario. Solo el OWNER o ADMIN pueden crear usuarios',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'Solo OWNER o ADMIN pueden crear usuarios',
  })
  @ApiHeader({
    name: 'x-tenant-id',
    required: true,
    description: 'ID del tenant',
  })
  @Post()
  createUser(
    @Body() dto: CreateUserDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.userService.createUser(dto, tenantId, user.userId);
  }

  /**
   * Retorna los datos del usuario autenticado actual.
   * El email se obtiene del JWT via @CurrentUser()
   * GET /user/me
   */
  @ApiOperation({
    summary: 'Perfil del usuario actual',
    description: 'Retorna los datos del usuario autenticado',
  })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.userService.findEmail(user.email);
  }

  /**
   * Lista todos los usuario que tienen membresía en eel tenant actual.
   * El tenantId se obtiene del JWT via @Currenttenant().
   * GET /user/tenant
   */
  @ApiOperation({
    summary: 'Usuarios del tenant',
    description: 'Lista todos los usuarios del tenant',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuaros' })
  @ApiHeader({
    name: 'x-tenant-id',
    required: true,
    description: 'ID del tenant',
  })
  @Get('tenant')
  getUsersByTenant(@CurrentTenant() tenantId: string) {
    return this.userService.findByTenant(tenantId);
  }
}
