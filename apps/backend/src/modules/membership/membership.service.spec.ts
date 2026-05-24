import { Test, TestingModule } from '@nestjs/testing';
import { MembershipService } from './membership.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

describe('MembershipService', () => {
  let service: MembershipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              membership: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
              },
              user: {
                findUnique: jest.fn(),
                create: jest.fn(),
              },
            },
            runInTransaction: jest.fn(),
          },
        },
        {
          provide: MembershipHelper,
          useValue: {
            validateCanMenageMembers: jest.fn(),
            validateIsOwner: jest.fn(),
            getMembershipRole: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
  });

  it('should b deeefined', () => {
    expect(service).toBeDefined();
  });
});
