export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';

export interface Room {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  description?: string;
  floor: number | null;
  area: number;
  capacity: number;
  rentPrice: number;
  deposit: number;
  status: RoomStatus;
  createdAt: string;
}

export interface RoomQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: RoomStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RoomStatistics {
  activeContracts: number;
  currentTenants: number;
  unpaidInvoices: number;
}
