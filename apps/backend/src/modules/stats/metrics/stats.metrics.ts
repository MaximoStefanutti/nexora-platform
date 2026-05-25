import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsMetrics {
  constructor(private prisma: PrismaService) {}

  async appointmentsByStatus(tenantId: string, from: Date, to: Date) {
    const appointments = await this.prisma.db.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId,
        startTime: { gte: from, lte: to },
      },
      _count: { status: true },
    });

    const result: Record<string, number> = {
      [AppointmentStatus.PENDING]: 0,
      [AppointmentStatus.CONFIRMED]: 0,
      [AppointmentStatus.CANCELLED]: 0,
      [AppointmentStatus.COMPLETED]: 0,
      [AppointmentStatus.NO_SHOW]: 0,
    };

    appointments.forEach((a) => {
      result[a.status] = a._count.status;
    });
    return result;
  }

  async revenue(tenantId: string, from: Date, to: Date) {
    const completed = await this.prisma.db.appointment.findMany({
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: from, lte: to },
      },
      select: {
        service: { select: { price: true } },
      },
    });
    const total = completed.reduce((sum, a) => {
      return sum + Number(a.service.price);
    }, 0);

    return {
      total: Number(total.toFixed(2)),
      completedAppointments: completed.length,
    };
  }

  async newCustomers(tenantId: string, from: Date, to: Date) {
    const newInPeriod = await this.prisma.db.customer.count({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
      },
    });
    const total = await this.prisma.db.customer.count({
      where: { tenantId },
    });
    return { newInPeriod, total };
  }

  async topServices(tenantId: string, from: Date, to: Date) {
    const services = await this.prisma.db.appointment.groupBy({
      by: ['serviceId'],
      where: {
        tenantId,
        startTime: { gte: from, lte: to },
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    });

    const serviceIds = services.map((s) => s.serviceId);
    const serviceDetails = await this.prisma.db.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });

    const serviceMap = Object.fromEntries(serviceDetails.map((s) => [s.id, s]));

    return services.map((s) => ({
      service: serviceMap[s.serviceId],
      count: s._count.serviceId,
    }));
  }

  async appointmentsTrend(tenantId: string, from: Date, to: Date) {
    const appointments = await this.prisma.db.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: from, lte: to },
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },

      select: { startTime: true },
      orderBy: { startTime: 'asc' },
    });

    const trend: Record<string, number> = {};

    appointments.forEach((a) => {
      const day = a.startTime.toISOString().split('T')[0];
      trend[day] = (trend[day] ?? 0) + 1;
    });

    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }
}
