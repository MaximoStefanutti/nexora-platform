import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Clase de métricas para el dashboard de estadísticas.
 * Cada método representa una métrica independiente del dashboard.
 *
 * Todas las métricas reciben tenantId, from y to para garantizar
 * el aisalmiento de datos entre tenants y la consistencia del período.
 *
 * Para agregar una nueva métrica:
 * 1. Agregar el método acá.
 * 2. Inyectarlo en StatsService.getDashboard() dentro del Promise.all
 */

@Injectable()
export class StatsMetrics {
  constructor(private prisma: PrismaService) {}

  /**
   * Cuenta los turnos agrupados por estado de período.
   * Garantiza que todos los estados aparecen en la respuesta aunque tengna 0,
   * para facilitar la renderización de gráficos en el frontend.
   *
   * @returns Record de cada AppointmentStatus y su cantidad.
   */

  async appointmentsByStatus(tenantId: string, from: Date, to: Date) {
    const appointments = await this.prisma.db.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId,
        startTime: { gte: from, lte: to },
      },
      _count: { status: true },
    });

    // Inicializamos todos los estados en 0 para garantizar consistencia en el frontend.
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

  /**
   * Calcula los ingresos del período basandose en turnos completados.
   * EL precio se obtiene del servicio asociado a cada turno.
   *
   * Nota: Solo cuenta turnos con status COMPLETED - los pendientes
   * y confirmados no se consideran ingresos hasta que se completen.
   *
   * @returns Total de ingresos y cantidad de turnos completados.
   */

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

    //Sumamos el preecio del servicio de cada turno completado.
    const total = completed.reduce((sum, a) => {
      return sum + Number(a.service.price);
    }, 0);

    return {
      total: Number(total.toFixed(2)),
      completedAppointments: completed.length,
    };
  }

  /**
   * Cuenta los clientes nuevos en el perído y el total acumulado.
   * Útil para medir el crecimiento de la base de clientes.
   *
   * @returns Nuevos clieentes en el período y total de clientes del tenant.
   */

  async newCustomers(tenantId: string, from: Date, to: Date) {
    // Ejecutamos ambas queries en paralelo.
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

  /**
   * Retorna los 5 seervicios más solicitados en el período.
   * Excluye turnos cancelados para reflejar demanda real.
   * Enriquece los resultados con el nombre y precio de cada servicio.
   *
   * @returns Array de hasta 5 servicios con su nombre, precio y cantidad de turnos.
   */

  async topServices(tenantId: string, from: Date, to: Date) {
    // Agrupamos turnos por servicio excluyendo cancelados.
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

    // Enriquecemos con los datos del servicio en una sola query adicional
    const serviceIds = services.map((s) => s.serviceId);
    const serviceDetails = await this.prisma.db.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });

    // Mapaeamos por ID para acceso O(1) al cominar resultados
    const serviceMap = Object.fromEntries(serviceDetails.map((s) => [s.id, s]));

    return services.map((s) => ({
      service: serviceMap[s.serviceId],
      count: s._count.serviceId,
    }));
  }

  /**
   * Calcula la tendencia de turnos agrupados por día en el período.
   * Excluye turnos cancelados para reflejar actividad real del negocio.
   * Usado para renderizar el gráfico de línea en el dashboard.
   *
   * @returns Array de objetos { date: YYYY-MM-DD, count: number}
   */
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

    // Agrupamos por día extrayendo solo la parte de fecha del ISO string
    const trend: Record<string, number> = {};

    appointments.forEach((a) => {
      const day = a.startTime.toISOString().split('T')[0];
      trend[day] = (trend[day] ?? 0) + 1;
    });

    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }
}
