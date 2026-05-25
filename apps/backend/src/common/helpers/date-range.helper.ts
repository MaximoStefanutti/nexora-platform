import { BadRequestException, Injectable } from '@nestjs/common';
import { DateRange, DateRangeFilter } from '../interfaces/date-range.interface';
import { StatsPeriod } from 'src/modules/stats/dto/stats-filter.dto';

@Injectable()
export class DateRangeHelper {
  resolve(filter: DateRangeFilter): DateRange {
    const now = new Date();

    if (filter.period === StatsPeriod.CUSTOM) {
      if (!filter.from || !filter.to) {
        throw new BadRequestException(
          'For custom period "from" and "to" are required',
        );
      }
      return {
        from: new Date(`${filter.from}T00:00:00.000Z`),
        to: new Date(`${filter.to}T23:59:59.999Z`),
      };
    }

    if (filter.period === StatsPeriod.LAST_7_DAYS) {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }

    if (filter.period === StatsPeriod.LAST_30_DAYS) {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    // Default: hoy
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  today(): DateRange {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  fromDateString(date: string): DateRange {
    return {
      from: new Date(`${date}T00:00:00:.000Z`),
      to: new Date(`${date}T23:59:59:999Z`),
    };
  }
}
