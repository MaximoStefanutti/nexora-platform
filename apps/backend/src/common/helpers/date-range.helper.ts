import { BadRequestException, Injectable } from '@nestjs/common';
import { DateRange, DateRangeFilter } from '../interfaces/date-range.interface';
import { StatsPeriod } from 'src/modules/stats/dto/stats-filter.dto';

/**
 * Helper para resolución de rangos de fechas.
 * Centraliza la lógica de conversión de períodos predefinidos
 * (today, last_7_days, last_30_days) y rango personalizados a objetos Date.
 *
 * Al ser un provider Global (registrado en CommonModule),
 * está disponible en toda la app sin necesidad de importarlo.
 * Usado principalmente en StatsService pero disponible para cualquier módulo
 * que necesite filtrar por período.
 */

@Injectable()
export class DateRangeHelper {
  /**
   * Resuelve un filtro de período a un rango de fechas concreto.
   * Si no se especifica período, retorna el día actual por defecto.
   *
   * @param filter - Filtro con period y/o from/to para período custom.
   * @throws BadRequestException si period=custom pero faltan from o to.
   * @returns Objeto DateRange con form y to como objetos Date.
   */
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
    // Default: hoy compelto en UTC.
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  /**
   * Retorna el rango del día actual (00:00:00 a 23:59:59).
   * Shortcut para obtener el período de hoy sin necesidad de un filtro.
   */

  today(): DateRange {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  /**
   * Construye un rango de fechas desde un string de fecha en formato YYYY-MM-DD.
   * Usado en AppointmentService.findByDate() para la vista de agenda diaría.
   *
   * @param date - Fecha en formato YYYY-MM-DD.
   * @returns DateRange que abarca todo el día en UTC.
   */

  fromDateString(date: string): DateRange {
    return {
      from: new Date(`${date}T00:00:00:.000Z`),
      to: new Date(`${date}T23:59:59.999Z`),
    };
  }
}
