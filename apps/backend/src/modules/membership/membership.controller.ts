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

@Controller('membership')
export class MembershipController {
  constructor(private membeshipService: MembershipService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.membeshipService.findAll(tenantId);
  }

  @Post('invite')
  invate(
    @Body() dto: InviteMemberDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membeshipService.invite(dto, tenantId, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membeshipService.update(id, dto, tenantId, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membeshipService.remove(id, tenantId, user.userId);
  }
}
