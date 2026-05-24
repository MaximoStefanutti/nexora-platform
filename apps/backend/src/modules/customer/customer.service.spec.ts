import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              customer: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                softDelete: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should be deeefineed', () => {
    expect(service).toBeDefined();
  });
});
