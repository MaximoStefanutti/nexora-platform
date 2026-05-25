import { Injectable } from '@nestjs/common';
import { StatsMetrics } from './metrics/stats.metrics';
import { DateRangeHelper } from 'src/common/helpers/date-range.helper';
import { StatsFilterDto } from './dto/stats-filter.dto';

@Injectable()
export class StatsService {
  constructor(
    private metrics: StatsMetrics,
    private dateRangeHelper: DateRangeHelper,
  ) {}

  async getDashboard(tenantId: string, filter: StatsFilterDto) {
    const { from, to } = this.dateRangeHelper.resolve(filter);

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
