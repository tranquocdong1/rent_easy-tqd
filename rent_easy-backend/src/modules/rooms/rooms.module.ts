import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomIndividualController } from './room.controller';
import { RoomUsageChecker } from './policies/room-usage-checker';
import { DummyRoomStatisticsProvider, RoomStatisticsProvider } from './providers/room-statistics.provider';

@Module({
  controllers: [RoomsController, RoomIndividualController],
  providers: [
    RoomsService,
    {
      provide: RoomStatisticsProvider,
      useClass: DummyRoomStatisticsProvider,
    },
  ],
  exports: [RoomsService],
})
export class RoomsModule {}
