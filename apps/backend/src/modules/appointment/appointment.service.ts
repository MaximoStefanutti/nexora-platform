import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentHelper } from 'src/common/helpers/appointment.helper';
import { MembershipHelper } from 'src/common/helpers/membership.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
    private appointmentHelper: AppointmentHelper,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.db.appointment.findMany({
      where: { tenantId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        notes: true,
        staffId: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
        service: {
          select: { id: true, name: true, duration: true, price: true },
        },
        createdAt: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const appointmeent = await this.prisma.db.appointment.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        notes: true,
        staffId: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        service: {
          select: { id: true, name: true, duration: true, price: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!appointmeent) {
      throw new NotFoundException('Shift not found');
    }
    return appointmeent;
  }

  async findByDate(tenantId: string, date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);

    const end = new Date(`${date}T23:59:59.999Z`);

    return this.prisma.db.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: start, lte: end },
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        staffId: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
        service: {
          select: { id: true, name: true, duration: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(dto: CreateAppointmentDto, tenantId: string, userId: string) {
    // Verificamos que el servicio existe y pertence al tenant
    const service = await this.prisma.db.service.findFirst({
      where: { id: dto.serviceId, tenantId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found or inactive');
    }

    // Verificamos que el cliente existe y pertenece al tenant

    const customer = await this.prisma.db.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Client not found');
    }

    // Verificamos que el staff es miembro activo del tenant
    const staffMembership = await this.prisma.db.membership.findFirst({
      where: {
        userId: dto.staffId,
        tenantId,
        isActive: true,
      },
    });

    if (!staffMembership) {
      throw new NotFoundException(
        'The staff is not an active member of the tenant',
      );
    }

    // Calculamos endTime desde startTime + duration del servicio
    const startTime = new Date(dto.startTime);
    const endTime = new Date(
      startTime.getTime() + service.duration * 60 * 1000,
    );

    // Validamos solapamiento de staff
    await this.appointmentHelper.validateStaffAvailability(
      dto.staffId,
      tenantId,
      startTime,
      endTime,
    );

    // Validamos solapamiento de cliente
    await this.appointmentHelper.validateCustomerAvailabilty(
      dto.customerId,
      tenantId,
      startTime,
      endTime,
    );

    return this.prisma.db.appointment.create({
      data: {
        startTime,
        endTime,
        notes: dto.notes,
        status: AppointmentStatus.PENDING,
        tenantId,
        customerId: dto.customerId,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        notes: true,
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, duration: true } },
        createdAt: true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    tenantId: string,
    userId: string,
  ) {
    const appointment = await this.prisma.db.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException('Shift not found');
    }

    // Validamos peemisos - solo staff asignado o ADMIN/OWNER
    await this.appointmentHelper.validateCanModify(
      appointment.staffId,
      userId,
      tenantId,
    );
    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'You cannot modify a completed or canceled shift',
      );
    }
    return this.prisma.db.appointment.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        notes: true,
        updatedAt: true,
      },
    });
  }

  async canceld(id: string, tenantId: string, userId: string) {
    const appointment = await this.prisma.db.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException('Shift not found');
    }

    await this.appointmentHelper.validateCanModify(
      appointment.staffId,
      userId,
      tenantId,
    );

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('The shift is already cancelled');
    }

    return this.prisma.db.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        updatedBy: userId,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });
  }
}
