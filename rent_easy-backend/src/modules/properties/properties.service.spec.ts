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
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
            auditLog: {
              create: jest.fn(),
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

  describe('create', () => {
    it('should create a property successfully', async () => {
      const createDto = {
        name: 'New Property',
        propertyType: 'HOUSE' as any,
        status: 'ACTIVE' as any,
        address: '123 New St',
      };

      const newProperty = { ...createDto, id: '1', ownerId: 'owner-id', createdAt: new Date(), updatedAt: new Date(), description: null };

      (prisma.property.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.property.create as jest.Mock).mockResolvedValue(newProperty);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.create('owner-id', createDto as any);

      expect(result.message).toBe('Property created successfully');
      expect(result.data.name).toBe('New Property');
      expect(prisma.property.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if property name already exists', async () => {
      const createDto = {
        name: 'Existing Property',
        propertyType: 'HOUSE' as any,
        status: 'ACTIVE' as any,
        address: '123 Old St',
      };

      (prisma.property.findFirst as jest.Mock).mockResolvedValue({ id: '1', name: 'Existing Property' });

      await expect(service.create('owner-id', createDto as any)).rejects.toThrow('Property đã tồn tại. Vui lòng chọn tên khác.');
      expect(prisma.property.create).not.toHaveBeenCalled();
    });
  });
});
