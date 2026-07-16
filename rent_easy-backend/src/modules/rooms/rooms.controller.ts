import { Controller, Get, Post, Body, Param, Query, UseGuards, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomQueryDto } from './dto/room-query.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/properties/:propertyId/rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Roles(Role.OWNER)
  findAll(
    @CurrentUser('id') ownerId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Query(new ValidationPipe({ transform: true })) query: RoomQueryDto,
  ) {
    return this.roomsService.findAll(ownerId, propertyId, query);
  }

  @Post()
  @Roles(Role.OWNER)
  create(
    @CurrentUser('id') ownerId: string,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) createRoomDto: CreateRoomDto,
  ) {
    return this.roomsService.create(ownerId, propertyId, createRoomDto);
  }
}
