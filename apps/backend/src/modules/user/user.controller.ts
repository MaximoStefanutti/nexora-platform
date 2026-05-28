import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';

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

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Crea un nuevo usuario en el sistema.
   * Requiere rol OWNER o ADMIN en el tenant actual.
   * POST /user
   */

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

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.userService.findEmail(user.email);
  }

  /**
   * Lista todos los usuario que tienen membresía en eel tenant actual.
   * El tenantId se obtiene del JWT via @Currenttenant().
   * GET /user/tenant
   */
  @Get('tenant')
  getUsersByTenant(@CurrentTenant() tenantId: string) {
    return this.userService.findByTenant(tenantId);
  }
}
