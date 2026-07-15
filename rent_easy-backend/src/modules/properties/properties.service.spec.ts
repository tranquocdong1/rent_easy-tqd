import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: PrismaService,
          useValue: {
            property: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of properties with pagination', async () => {
      const mockProperties = [
        {
          id: '1',
          name: 'House 1',
          propertyType: 'HOUSE',
          status: 'ACTIVE',
          address: '123 Test St',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
      (prisma.property.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll('owner-id', { page: 1, limit: 10 });

      expect(result.data.items).toHaveLength(1);
      expect(result.data.meta.totalItems).toBe(1);
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'owner-id', deletedAt: null },
          skip: 0,
          take: 10,
        })
      );
    });
  });
});
