import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; slug: string }) {
    return this.prisma.db.tenant.create({
      data,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.db.tenant.findUnique({
      where: { slug },
    });
  }
}
