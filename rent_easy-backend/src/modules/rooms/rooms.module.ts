import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomIndividualController } from './room.controller';
import { DefaultRoomUsageChecker, RoomUsageChecker } from './policies/room-usage-checker';
import { DummyRoomStatisticsProvider, RoomStatisticsProvider } from './providers/room-statistics.provider';

@Module({
  controllers: [RoomsController, RoomIndividualController],
  providers: [
    RoomsService,
    {
      provide: RoomUsageChecker,
      useClass: DefaultRoomUsageChecker,
    },
    {
      provide: RoomStatisticsProvider,
      useClass: DummyRoomStatisticsProvider,
    },
  ],
  exports: [RoomsService],
})
export class RoomsModule {}
