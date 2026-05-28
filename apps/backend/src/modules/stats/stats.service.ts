import { Injectable } from '@nestjs/common';
import { StatsMetrics } from './metrics/stats.metrics';
import { DateRangeHelper } from 'src/common/helpers/date-range.helper';
import { StatsFilterDto } from './dto/stats-filter.dto';

/**
 * Servicio de estádisticas del tenant.
 * Orquesta las métricas del dashboard resolviendo el rango de fechas
 * y ejecutando todas las consultas en paralelo para meejor performance.
 *
 * Arquitectura:
 * - StatsService: orqueeesta y combina las métricas.
 * - StatsMetrics: contiene la lógica de cada métrica individual.
 * - DateRangeHelper: resuelve el rango de fechas según el filtro.
 */

@Injectable()
export class StatsService {
  constructor(
    private metrics: StatsMetrics,
    private dateRangeHelper: DateRangeHelper,
  ) {}

  /**
   * Retorna el dashboard completo de estadísticas para el tenant.
   * Todas las méticas se calculan een paralelo con Promise.all
   * para minimizar el tiempo de respuesta.
   *
   * @param tenantId - ID del tenant actual.
   * @param filter - Filtro de período (today, last_7_days, last_30_days, custom).
   * @returns Objeto de todas las métricas del período seleccionado.
   */

  async getDashboard(tenantId: string, filter: StatsFilterDto) {
    // Resolvemos el rango de fechas según el filtro recibido.
    const { from, to } = this.dateRangeHelper.resolve(filter);

    // Ejecutamos todas las méticas en paralelo para mejorar peerformance.
    const [
      appointmentsByStatus,
      revenue,
      newCustomers,
      topServices,
      appointmentsTrend,
    ] = await Promise.all([
      this.metrics.appointmentsByStatus(tenantId, from, to),
      this.metrics.revenue(tenantId, from, to),
      this.metrics.newCustomers(tenantId, from, to),
      this.metrics.topServices(tenantId, from, to),
      this.metrics.appointmentsTrend(tenantId, from, to),
    ]);

    return {
      period: { from, to },
      appointmentsByStatus,
      revenue,
      newCustomers,
      topServices,
      appointmentsTrend,
    };
  }
}
