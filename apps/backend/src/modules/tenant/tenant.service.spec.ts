import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              tenant: {
                findFirst: jest.fn(),
                create: jest.fn(),
              },
              membership: { create: jest.fn() },
            },
            runInTransaction: jest.fn(),
          },
        },
        {
          provide: MembershipHelper,
          useValue: {
            validateCanManageMembers: jest.fn(),
            validateIsOwner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
