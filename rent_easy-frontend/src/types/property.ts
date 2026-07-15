export type PropertyType = 'HOUSE' | 'BOARDING_HOUSE' | 'MINI_APARTMENT' | 'OTHER';
export type PropertyStatus = 'ACTIVE' | 'INACTIVE';

export interface Property {
  id: string;
  name: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  address: string;
  roomCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  data: {
    items: T[];
    meta: PaginationMeta;
  };
  message: string;
}

export interface PropertyQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: PropertyStatus;
}

export interface CreatePropertyPayload {
  name: string;
  propertyType: PropertyType;
  status?: PropertyStatus;
  address: string;
  description?: string;
}

