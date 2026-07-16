import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomIndividualController } from './room.controller';

@Module({
  controllers: [RoomsController, RoomIndividualController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
