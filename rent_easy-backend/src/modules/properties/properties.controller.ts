import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyQueryDto } from './dto/property-query.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
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

  @Post()
  create(@Request() req, @Body() createPropertyDto: CreatePropertyDto) {
    const ownerId = req.user.id;
    return this.propertiesService.create(ownerId, createPropertyDto);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const ownerId = req.user.id;
    return this.propertiesService.findOne(ownerId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    const ownerId = req.user.id;
    return this.propertiesService.update(ownerId, id, updatePropertyDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const ownerId = req.user.id;
    return this.propertiesService.remove(ownerId, id);
  }
}
