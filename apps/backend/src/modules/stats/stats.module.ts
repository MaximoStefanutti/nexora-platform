import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsMetrics } from './metrics/stats.metrics';
import { StatsController } from './stats.controller';

@Module({
  providers: [StatsService, StatsMetrics],
  controllers: [StatsController],
})
export class StatsModule {}
