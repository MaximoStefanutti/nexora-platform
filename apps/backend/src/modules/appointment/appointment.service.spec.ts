import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from 'src/common/helpers/membership.helper';
import { AppointmentHelper } from 'src/common/helpers/appointment.helper';

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              appointment: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
              },
              service: { findFirst: jest.fn() },
              customer: { findFirst: jest.fn() },
              membership: { findFirst: jest.fn() },
            },
          },
        },
        {
          provide: MembershipHelper,
          useValue: {
            vlaidateCanManageMembers: jest.fn(),
            getMembershipRole: jest.fn(),
          },
        },
        {
          provide: AppointmentHelper,
          useValue: {
            validateStaffAvailability: jest.fn(),
            validateCustomerAvailability: jest.fn(),
            validateCanModify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
