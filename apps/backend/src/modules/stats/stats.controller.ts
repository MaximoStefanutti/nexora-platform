import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { StatsFilterDto } from './dto/stats-filter.dto';

@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentTenant() tenantId: string,
    @Query() filter: StatsFilterDto,
  ) {
    return this.statsService.getDashboard(tenantId, filter);
  }
}
