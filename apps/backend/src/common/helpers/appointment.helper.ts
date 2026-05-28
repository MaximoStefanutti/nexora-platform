import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AppointmentStatus, SystemRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from './membership.helper';

/**
 * Helper de validaciones para turnos (appointments).
 * Centraliza las validaciones de disponibilidad y permisos
 * para ser reutilizadas n el módulo appointments.
 *
 * Al ser provider Global (regustrado en CommonModule),
 * está disponible en toda la app sin necesidad de importarlo.
 */

@Injectable()
export class AppointmentHelper {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  /**
   * Valida que el staff no tenga un turno superpuesto en el horario dado.
   * Verifica tres casois de solapamiento:
   * 1. El nuevo turno empieza durante un turno existente.
   * 2. El nuevo turno termina durante un turno existente.
   * 3. EL nuevo turno contiene completamente un turno existente.
   *
   * @param staffId - userId del staff a validar.
   * @param tenantId - ID del tenant.
   * @param startTime - Inicio del nuevo turno.
   * @param endTime - Fin del nuevo turno.
   * @param excludeId - UUID del turno a excluir (útil al reprogramar).
   * @throws ConflictException si hay solapamiento de horarios.
   */

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

  /**
   * Valida que el cliente no tenga un turno superpuesto en el horario dado.
   * Aplica la misma lógica de tres casos que validateStaffAvailability.
   *
   * @param customerId - ID del cliente a validar.
   * @param tenantId - ID del tenant.
   * @param startTime - Inicio del nuevo turno.
   * @param endTime - Fin del nuevo turno.
   * @param excludeId - UUID de turno a excluir (útil a reprogramar).
   * @throws ConflicException si hay solapamiento de horarios.
   */

  async validateCustomerAvailability(
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

  /**
   * Valida que el usuario tiene permisos para modificar o cancelar un turno.
   * El staff asignado siempre puede modificar su propio turno.
   * ADMIN y OWNER también pueden modificar cualquier turno del tenant.
   *
   * @param staffId - userId del staff asignado al turno.
   * @param userId - userId del usuario que intenta modificar.
   * @param tenantId - ID del tenant.
   * @throws ForbiddenException si el usuario no tiene permisos.
   */

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
