import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MembershipService } from './membership.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/interfaces/jwt-payload.interface';
import { UpdateMemberDto } from './dto/update-member.dto';

/**
 * Controller de gestión de membresías.
 * Todos los endpoints requieren autenticación y conetexto de tenant (x-tenant-id)
 *
 * Permisos requeridos:
 * - GET /membership - cualquier miembro del tenant.
 * - POST /membership/invitee - OWNER o ADMIN.
 * - PATCH /membership/:id - OWNER o ADMIN.
 * - DELETE /membership/:id - OWNER o ADMIN.
 */

@Controller('membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  /**
   *
   * @param tenantId Lista todos los miembros del tenant con sus datos de usuario y rol.
   * GET /membership
   */

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.membershipService.findAll(tenantId);
  }

  /**
   * Invita un usuario al tenant.
   * Si el usuario no existe en el sistema se crea automáticamente.
   * POST /membership/invite
   */

  @Post('invite')
  invite(
    @Body() dto: InviteMemberDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membershipService.invite(dto, tenantId, user.userId);
  }

  /**
   * Actualiza el rol o estado activo de un miembro.
   * PATCH /membership/:id
   */

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membershipService.update(id, dto, tenantId, user.userId);
  }

  /**
   * Desactiva la membresía de un usuario en el tenant.
   * //*! El OWNER no puede ser removido.
   * DELETE /membership/:id
   */

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membershipService.remove(id, tenantId, user.userId);
  }
}
