import { Property, PropertyStatus, PropertyType } from '@prisma/client';

export class PropertyResponseDto {
  id: string;
  name: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  address: string;
  description: string | null;
  roomCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PropertyResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(property: Property, roomCount: number = 0): PropertyResponseDto {
    return new PropertyResponseDto({
      id: property.id,
      name: property.name,
      propertyType: property.propertyType,
      status: property.status,
      address: property.address,
      description: property.description,
      roomCount,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    });
  }
}
