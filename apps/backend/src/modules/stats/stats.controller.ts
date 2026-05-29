import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { StatsFilterDto, StatsPeriod } from './dto/stats-filter.dto';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
@ApiTags('Stats')
@ApiBearerAuth('JWT')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'ID del tenant',
})
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  /**
   * Retorna el dashboard de estadísticas para el tenant.
   * GET /stats/dashboard
   * GET /stats/dashboard?period=last_7_days
   * GET /stats/dashboard?period=custom&from=2026-05-01&to=2026-05-31
   */
  @ApiOperation({
    summary: 'Dashboard de estadísticas',
    description:
      'Retorna todas las métricas del tenant para el período seleccionado: turnos por estado, ingreso, clientes nuevos, servicios más solicitados y tendencia diaria',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: StatsPeriod,
    example: StatsPeriod.LAST_30_DAYS,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    example: '2026-05-01',
    description: 'Solo para period=custom',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    example: '2026-05-31',
    description: 'Solo para period=custom',
  })
  @ApiResponse({ status: 200, description: 'Dashboard de estadísticas' })
  @ApiResponse({
    status: 400,
    description: 'Faltan form o to para período custom',
  })
  @Get('dashboard')
  getDashboard(
    @CurrentTenant() tenantId: string,
    @Query() filter: StatsFilterDto,
  ) {
    return this.statsService.getDashboard(tenantId, filter);
  }
}
