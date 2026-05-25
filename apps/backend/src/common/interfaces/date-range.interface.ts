import { StatsPeriod } from 'src/modules/stats/dto/stats-filter.dto';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangeFilter {
  period?: StatsPeriod;
  from?: string;
  to?: string;
}
