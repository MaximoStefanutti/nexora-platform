import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

describe('ServiceService', () => {
  let service: ServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              service: {
                findMany: jest.fn(),
                findFrist: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                softDelete: jest.fn(),
              },
            },
          },
        },
        {
          provide: MembershipHelper,
          useValue: {
            validatreManageMembers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
