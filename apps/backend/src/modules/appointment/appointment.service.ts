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

/**
 * Servicio de gestión de turnos (appointments)
 * Un turno representa una reserva de tiempo entre un cliente,
 * un miembro de staff y un servicio.
 *
 * Reglas de negocio:
 * - El endTime se calcula automáticamente desde startTime + duration del servicio.
 * - No puede haber solapamiento de horarios para el mismo staff.
 * - No puede haber solapamiento de horarios para el mismo cliente.
 * - Solo el staff asignado o un ADMIN/OWNER pueede modificar o cancelar un turno.
 * - Los turnos completados o cancelados no se pueden ser modificados.
 */

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
    private appointmentHelper: AppointmentHelper,
  ) {}

  /**
   * Lista todos los turnos del tenant ordenados por fecha de inicio.
   * Incluye datos deel cliente y servicio asociados.
   *
   * @param tenantId - ID del tenant actual.
   */

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

  /**
   * Obtiene el detalle completo de un turno específico.
   *
   * @param id - UUID del turno.
   * @param tenantId - ID del tenant actual.
   * @throws NotFoundException si el turno no existe en el tenant.
   */

  async findOne(id: string, tenantId: string) {
    const appointment = await this.prisma.db.appointment.findFirst({
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
    if (!appointment) {
      throw new NotFoundException('Shift not found');
    }
    return appointment;
  }

  /**
   * Lista los turnos de un día específico eexcluyendo los cancelados.
   * Usado para la vista de ageenda diaria del tenant
   *
   * @param tenantId - ID del tenant actual.
   * @param date - Fecha en formato YYYY.MM.DD
   */

  async findByDate(tenantId: string, date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);

    const end = new Date(`${date}T23:59:59.999Z`);

    return this.prisma.db.appointment.findMany({
      // Construimos el rango del día en UTC para consistencia.
      where: {
        tenantId,
        startTime: { gte: start, lte: end },
        //Excluimos cancelados - no tiene valor en la agenda diaria.
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

  /**
   * Crea un nuevo turno con validaciones de disponibilidad.
   * Calcula el endTime automáticamente desde startTime + duration del servicio.
   *
   * @param dto - Datos del turno (startTime, customerId, serviceId, staffId, notes).
   * @param tenantId - ID del tenant actual.
   * @param userId - userId dl usuario que crea el turno (para auditoría).
   * @throws NotFoundException si el servicio, cliente o staff no existe.
   * @throws ConflicException si hay solapamiento de horarios.
   */

  async create(dto: CreateAppointmentDto, tenantId: string, userId: string) {
    // Verificamos que el servicio existe, pertenezca al tenant y que este activo.
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

    // Calculamos endTime automáticamente: startTime + duration del servicio
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
    await this.appointmentHelper.validateCustomerAvailability(
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

  /**
   * Actualiza el estado o notas de un turno existente.
   * No permite modificar turnos completados o cancelados.
   * Permite solamente que lo modifique el staff asignado o OWNER/ADMIN del negocio.
   *
   * @param id - UUDI del turno.
   * @param dto - Campos a actualizar (status, notes).
   * @param tenantId - ID del tenant actual.
   * @param userId - userId del usuario que actualiza.
   * @throws NotFoundExcpetion si no tiene permisos o el turno está finalizado.
   */

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

    // Validamos permisos - solo staff asignado o ADMIN/OWNER pueda modificar.
    await this.appointmentHelper.validateCanModify(
      appointment.staffId,
      userId,
      tenantId,
    );
    // Los turnos completados o cancelados son inmutables.
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

  /**
   * Cancela un turno cambiando su estado a CANCELLED.
   * Los turnos completados no se pueden cancelar.
   *
   * @param id - UUID del turno.
   * @param tenantId - ID del tenant actual.
   * @param userId - userID del usuario que cancela.
   * @throws NotFoundException si el turno no existe.
   * @throws ConflicException si el turno ya esta cancelado
   * @throws ForbiddenException si no tiene permisos o el turno está completo.
   */

  async cancel(id: string, tenantId: string, userId: string) {
    const appointment = await this.prisma.db.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException('Shift not found');
    }

    // Validamos permisos - solo staff asignado o ADMIN/OWNER puede cancelar.
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
