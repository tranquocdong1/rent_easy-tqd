import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { NotFoundException } from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { RoomUsageChecker } from './policies/room-usage-checker';
import { RoomStatisticsProvider } from './providers/room-statistics.provider';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    property: {
      findFirst: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RoomUsageChecker, useValue: { canDeleteRoom: jest.fn().mockResolvedValue(true) } },
        {
          provide: RoomStatisticsProvider,
          useValue: { getRoomStats: jest.fn().mockResolvedValue({ activeContracts: 0, currentTenants: 0, unpaidInvoices: 0 }) },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should throw NotFoundException if property does not exist', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.findAll('owner-id', 'property-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return paginated rooms', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({ id: 'property-id' });
      
      const mockRooms = [
        {
          id: 'room-1',
          code: '101',
          name: 'Room 101',
          floor: 1,
          area: 20,
          capacity: 2,
          rentPrice: 3000,
          deposit: 3000,
          status: RoomStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);
      mockPrismaService.room.count.mockResolvedValue(1);

      const result = await service.findAll('owner-id', 'property-id', { page: 1, limit: 10 });
      
      expect(result.data.meta.totalItems).toBe(1);
      expect(result.data.items[0].code).toBe('101');
      expect(result.data.items[0]).not.toHaveProperty('updatedAt'); // Ensure updatedAt is omitted
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if status is OCCUPIED', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({ id: 'property-id' });

      await expect(
        service.create('owner-id', 'property-id', {
          code: '101',
          name: '101',
          area: 20,
          capacity: 2,
          rentPrice: 3000,
          deposit: 3000,
          status: RoomStatus.OCCUPIED,
        })
      ).rejects.toThrow('Không thể tạo phòng với trạng thái đang cho thuê (OCCUPIED).');
    });

    it('should throw ConflictException if room code already exists', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue({ id: 'property-id' });
      mockPrismaService.room.findFirst.mockResolvedValue({ id: 'existing-room' });

      await expect(
        service.create('owner-id', 'property-id', {
          code: '101',
          name: '101',
          area: 20,
          capacity: 2,
          rentPrice: 3000,
          deposit: 3000,
        })
      ).rejects.toThrow('Mã phòng đã tồn tại trong tài sản này.');
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if update body is empty', async () => {
      await expect(service.update('owner-id', 'room-id', {})).rejects.toThrow(
        'Không có dữ liệu để cập nhật.'
      );
    });

    it('should throw NotFoundException if room not found', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue(null);

      await expect(
        service.update('owner-id', 'room-id', { name: 'New Name' })
      ).rejects.toThrow('Không tìm thấy phòng.');
    });

    it('should throw BadRequestException if no fields are actually changed', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue({
        id: 'room-id',
        propertyId: 'property-id',
        name: 'Old Name',
      });
      mockPrismaService.property.findFirst.mockResolvedValue({ id: 'property-id' }); // property ownership OK

      await expect(
        service.update('owner-id', 'room-id', { name: 'Old Name' })
      ).rejects.toThrow('Không có thay đổi nào so với dữ liệu hiện tại.');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if room not found', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue(null);

      await expect(service.remove('owner-id', 'room-id')).rejects.toThrow(
        'Không tìm thấy phòng.'
      );
    });

    it('should throw ConflictException if room is in use', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue({
        id: 'room-id',
        propertyId: 'property-id',
      });
      mockPrismaService.property.findFirst.mockResolvedValue({ id: 'property-id' });
      
      // Override the checker for this test
      jest.spyOn((service as any).roomUsageChecker, 'canDeleteRoom').mockResolvedValue(false);

      await expect(service.remove('owner-id', 'room-id')).rejects.toThrow(
        'Phòng đang được sử dụng (có Hợp đồng hoặc Người thuê), không thể xóa.'
      );
    });
  });
});
