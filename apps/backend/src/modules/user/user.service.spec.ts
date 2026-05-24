import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

describe('useService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              user: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
              },
            },
          },
        },
        {
          provide: MembershipHelper,
          useValue: {
            validateCanMangeMembers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
