import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipHelper } from 'src/common/helpers/membership.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(
    private prisma: PrismaService,
    private membershiHelper: MembershipHelper,
  ) {}

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

  async create(dto: CreateServiceDto, tenantId: string, userId: string) {
    await this.membershiHelper.validateCanManageMembers(userId, tenantId);

    return this.prisma.db.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration!,
        price: dto.price,
        isActive: dto.isActive ?? true,
        tenantId,
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

  async update(
    id: string,
    dto: UpdateServiceDto,
    tenantId: string,
    userId: string,
  ) {
    await this.membershiHelper.validateCanManageMembers(userId, tenantId);

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

  async remove(id: string, tenantId: string, userId: string) {
    await this.membershiHelper.validateCanManageMembers(userId, tenantId);

    const service = await this.prisma.db.service.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.db.service.softDelete({ id });

    return { message: 'Service removed successfully' };
  }
}
