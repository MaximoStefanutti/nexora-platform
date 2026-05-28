import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { StatsFilterDto } from './dto/stats-filter.dto';

/**
 * Controlleer dee estadísticas del tenant.
 * Todos los endpoints requieren autenticación JWT y conetxto de tenant.
 *
 * Rutas disponibles:
 * - GET /stats/dashboard - dashboard completo con todas las métricas.
 *
 * Filtros disponibles vía query params:
 * - period=today - métricas del día actual.
 * - period=last_7_days - métricas de los últimos 7 días.
 * - period=last_30_days - métricas de los últimos 30 días.
 * - period=custom&from=YYYY-MM-DD&to=YYYY-MM-DD - rango personalizado.
 */

@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  /**
   * Retorna el dashboard de estadísticas para el tenant.
   * GET /stats/dashboard
   * GET /stats/dashboard?period=last_7_days
   * GET /stats/dashboard?period=custom&from=2026-05-01&to=2026-05-31
   */

  @Get('dashboard')
  getDashboard(
    @CurrentTenant() tenantId: string,
    @Query() filter: StatsFilterDto,
  ) {
    return this.statsService.getDashboard(tenantId, filter);
  }
}
