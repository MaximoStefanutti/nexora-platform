import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipHelper } from 'src/common/helpers/membership.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

/**
 * Servicio de gestión de servicios del tenant.
 * Un servicio representa una prestación que ofrece el negocio
 * (ej: corte de cabello, consulta médica, clase de yoga).
 *
 * Los servicios se usan como base para crear turnos (Appointment).
 * El campo duration define automáticamente el endTime deel turno.
 *
 * Permisos: solo OWNER o ADMIN pueden crear, modificar o eliminar servicios.
 */

@Injectable()
export class ServiceService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  /**
   *
   * @param tenantId Lista todos los servicios activos del tenant ordenados por nombre.
   * Solo retorna servicios con isActive: true y deletedAt null.
   *
   * @param tenantId - ID del tenant actual.
   */

  async findAll(tenantId: string) {
    return this.prisma.db.service.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtiene un servicio específico por ID con contador de turnos asociados.
   * El contador de appointments es útil para saber si el servicio está en uso.
   *
   * @param id - UUID del servicio.
   * @param tenantId - ID del tenant actual.
   * @throws NotFoundException si el servicio no existe en el tenant.
   */

  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.db.service.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Contador de turnos - útil para saber si el servicio está en uso.
        _count: {
          select: { appointments: true },
        },
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  /**
   * Crea un nuevo servicio para el tenant.
   * Solo OWNER o ADMIN pueden crear servicios.
   *
   * @param dto - Datos del servicio (name, description, duration, price, isActive).
   * @param tenantId - ID del tenant actual.
   * @param userId - userId del usuario que crea el servicio (par auditoría).
   * @throws ForbinddenException si el usuario no es OWNER o ADMIN.
   */

  async create(dto: CreateServiceDto, tenantId: string, userId: string) {
    // Solo OWNER y ADMIN pueden crear servicios.
    await this.membershipHelper.validateCanManageMembers(userId, tenantId);

    return this.prisma.db.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        isActive: dto.isActive ?? true,
        tenantId,
        // Campos de auditoría - quién creó y modificó el registro.
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * Actualiza los datos de un servicio existente.
   * Solo OWNER o ADMIN pueden actualizar servicios.
   *
   * @param id - UUID del servicio a actualizar.
   * @param dto - Campos a actualizar (todos opcionales).
   * @param tenantId - ID del tenant actual.
   * @param userId - userId del usuario que actualiza (para auditoría).
   * @throws NotFoundException si el servicio no existe en el tenant.
   * @throws ForbiddenException si el usuario no es OWNER o ADMIN.
   */

  async update(
    id: string,
    dto: UpdateServiceDto,
    tenantId: string,
    userId: string,
  ) {
    // Solo OWNER o ADMIN pueden actualizar servicios.
    await this.membershipHelper.validateCanManageMembers(userId, tenantId);

    const service = await this.prisma.db.service.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.forTenant({ tenantId }, { userId }).service.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Elimina un servicio vía soft deleete (seteea deletedAt).
   * El servicio no aparecerá en las queries pero sus datos se conservan.
   * Solo OWNER o ADMIN pueden eliminar servicios.
   *
   * @param id - UUID del servicio a eliminar.
   * @param tenantId - ID del tenant actual.
   * @param userId - userId del usuario que elimina.
   * @throws NotFoundException si el servicio no existe en el tenant.
   * @throws ForbiddenException si el usuario no es OWNER o ADMIN.
   */

  async remove(id: string, tenantId: string, userId: string) {
    // Solo OWNER y ADMIN pueden eliminar servicios.
    await this.membershipHelper.validateCanManageMembers(userId, tenantId);

    const service = await this.prisma.db.service.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Soft delete - setea deletedAt en vez de eliminar el registro.
    await this.prisma.db.service.softDelete({ id });

    return { message: 'Service removed successfully' };
  }
}
