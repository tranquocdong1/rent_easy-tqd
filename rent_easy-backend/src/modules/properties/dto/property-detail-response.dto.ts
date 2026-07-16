import { Property } from '@prisma/client';
import { PropertyResponseDto } from './property-response.dto';
import { PropertyStatistics } from '../property-statistics.service';

export class PropertyDetailResponseDto extends PropertyResponseDto {
  statistics: PropertyStatistics;

  constructor(partial: Partial<PropertyDetailResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  static fromEntityWithStats(
    property: Property,
    roomCount: number,
    statistics: PropertyStatistics,
  ): PropertyDetailResponseDto {
    const baseDto = PropertyResponseDto.fromEntity(property, roomCount);
    return new PropertyDetailResponseDto({
      ...baseDto,
      statistics,
    });
  }
}
