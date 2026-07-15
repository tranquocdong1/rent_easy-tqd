import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyQueryDto } from './dto/property-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll(@Request() req, @Query() query: PropertyQueryDto) {
    const ownerId = req.user.id;
    return this.propertiesService.findAll(ownerId, query);
  }
}
