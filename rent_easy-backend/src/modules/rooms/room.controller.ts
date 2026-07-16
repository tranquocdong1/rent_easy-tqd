import { Controller, Get, Body, Param, Patch, UseGuards, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomIndividualController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(':id')
  @Roles(Role.OWNER)
  findOne(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.roomsService.findOne(ownerId, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  update(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(ownerId, id, updateRoomDto);
  }
}
