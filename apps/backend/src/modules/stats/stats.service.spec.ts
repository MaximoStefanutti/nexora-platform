import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { StatsMetrics } from './metrics/stats.metrics';
import { DateRangeHelper } from 'src/common/helpers/date-range.helper';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: StatsMetrics,
          useValue: {
            appointmentsByStatus: jest.fn(),
            revenue: jest.fn(),
            newCustomers: jest.fn(),
            topServices: jest.fn(),
            appointmentsTrend: jest.fn(),
          },
        },
        {
          provide: DateRangeHelper,
          useValue: {
            resolve: jest.fn().mockReturnValue({
              from: new Date(),
              to: new Date(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
