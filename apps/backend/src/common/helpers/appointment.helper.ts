import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AppointmentStatus, SystemRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from './membership.helper';

@Injectable()
export class AppointmentHelper {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  async validateStaffAvailability(
    staffId: string,
    tenantId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const overlap = await this.prisma.db.appointment.findFirst({
      where: {
        tenantId,
        staffId,
        status: { not: AppointmentStatus.CANCELLED },
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException('The staff already has a shift at that time');
    }
  }

  async validateCustomerAvailabilty(
    customerId: string,
    tenantId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const overlap = await this.prisma.db.appointment.findFirst({
      where: {
        tenantId,
        customerId,
        status: { not: AppointmentStatus.CANCELLED },
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException(
        'The client already has a shift at that time',
      );
    }
  }

  async validateCanModify(
    staffId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    // El staff asigando siempre puede modificar su propio turno
    if (staffId === userId) return;

    // ADMIN y OWNER también pueden modifcar
    const role = await this.membershipHelper.getMembershipRole(
      userId,
      tenantId,
    );

    if (role !== SystemRole.ADMIN && role !== SystemRole.OWNER) {
      throw new ForbiddenException(
        'Only the assigned staff or the OWNER or ADMIN can modify the shift',
      );
    }
  }
}
