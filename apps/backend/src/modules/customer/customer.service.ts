import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * Servicio de gestión de clientes (CRM).
 * Un cliente pertenece a un tenant específico y puede tener
 * múltiples turnos asociados.
 *
 * Reglas de negocio:
 * - El emial es único por tenant (no globalmente).
 * - Los clientes se eliminan vía soft delete para conservar historial de turnos.
 * - Cualquier miembro del tenant puede crear y modificar clientes.
 */

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos los clientes activos del tenant ordenados por nombre.
   * Incluye contador de turnos para mostrar en la lista del CRM.
   *
   * @param tenantId  - ID del tenant actual.
   */

  async findAll(tenantId: string) {
    return this.prisma.db.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        // Contador de turnos - útil para mostrar actividad del client.
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtiene un cliente específico con todos sus datos y contador de turnos.
   *
   * @param id - UUID del cliente.
   * @param tenantId - ID del tenant actual.
   * @throws NotFoundException si el cliente no existe en el tenant.
   */

  async findOne(id: string, tenantId: string) {
    const customer = await this.prisma.db.customer.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Client not found');
    }
    return customer;
  }

  /**
   * Crea un nuevo cliente en el tenant.
   * Valida que el emial no esté en uso dentro del mismo tenant.
   *
   * @param dto - Datos del cliente (name, email, phone, notes, status).
   * @param tenantId - ID del tenant actual.
   * @param userId - userID del usuario que crea el cliente (para auditoría).
   * @throws ConfilictException si ya existe un cliente con ese email en el tenant.
   */

  async create(dto: CreateCustomerDto, tenantId: string, userId: string) {
    // Validamos unicidad de email por tenant antes de crear.
    if (dto.email) {
      const existing = await this.prisma.db.customer.findFirst({
        where: { tenantId, email: dto.email },
      });

      if (existing) {
        throw new ConflictException(
          `There is already a client with the email "${dto.email}"`,
        );
      }
    }

    return this.prisma.db.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        status: dto.status,
        tenantId,
        // Campos de auditoría.
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Actualiza los datos de un cliente existente.
   * Si se actualiza el email, valida que no esté en uso por otro cliente del tenant.
   *
   * @param id - UUID del cliente a actualizar.
   * @param dto - Campos a actualizar (todos opcional).
   * @param tenantId - ID del tenant actual.
   * @param userId - userId del usuario que actualiza (para auditoria).
   * @throws NotFoundException si el cliente no existe en el tenant.
   * @throws ConflicException si el nuevo emial ya está en uso en el tenant.
   */

  async update(
    id: string,
    dto: UpdateCustomerDto,
    tenantId: string,
    userId: string,
  ) {
    const customer = await this.prisma.db.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Client not found');
    }

    // Validamos unicidad de email solo si se está cambiando.
    if (dto.email && dto.email !== customer.email) {
      const existing = await this.prisma.db.customer.findFirst({
        where: { tenantId, email: dto.email },
      });

      if (existing) {
        throw new ConflictException(
          `There is already a client with the email "${dto.email}"`,
        );
      }
    }
    return this.prisma.db.customer.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        notes: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Elimina un cliente vía soft delete (setea deletedAt).
   * Registra quién realizó la eliminación antes del soft delete.
   * El historial de turnos del cliente se conserva.
   *
   * @param id - UUID del cliente a eliminar.
   * @param tenantId - ID del tenant actual.
   * @param userId - userId del usuario que elimina (para auditoría).
   * @throws NotFoundException si el cliente no existe en el tenant.
   */

  async remove(id: string, tenantId: string, userId: string) {
    const customer = await this.prisma.db.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente not found');
    }

    // Registamos quien eliminó el cliente antes del soft delete.
    await this.prisma.db.customer.update({
      where: { id },
      data: { updatedBy: userId },
    });

    // Soft delete - setea deletedAt en lugar de elimnar el registro.
    await this.prisma.db.customer.softDelete({ id });

    return { message: 'Client removed successfully' };
  }
}
