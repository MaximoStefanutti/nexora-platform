import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

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
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

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

  async create(dto: CreateCustomerDto, tenantId: string, userId: string) {
    // Email único por tenant
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

    // Verificar email único por tenant si se está actualizando
    if (dto.email && dto.email != customer.email) {
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

  async remove(id: string, tenantId: string, userId: string) {
    const customer = await this.prisma.db.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente not found');
    }

    await this.prisma.db.customer.update({
      where: { id },
      data: { updatedBy: userId },
    });

    await this.prisma.db.customer.softDelete({ id });

    return { message: 'Client removed successfully' };
  }
}
