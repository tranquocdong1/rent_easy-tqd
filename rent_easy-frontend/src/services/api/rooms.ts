import axiosInstance from '@/lib/axios';
import { PaginatedResponse } from '@/types/property';
import { Room, RoomQuery, RoomStatus } from '@/types/room';

export interface CreateRoomPayload {
  code: string;
  name: string;
  floor?: number | null;
  area: number;
  capacity: number;
  rentPrice: number;
  deposit: number;
  status?: RoomStatus;
  description?: string | null;
}

export type UpdateRoomPayload = Omit<Partial<CreateRoomPayload>, 'status'>;

export const roomsApi = {
  getAllByProperty: async (propertyId: string, query?: RoomQuery): Promise<PaginatedResponse<Room>> => {
    const params = query 
      ? Object.fromEntries(Object.entries(query).filter(([_, v]) => v !== '' && v != null)) 
      : undefined;
    const response = await axiosInstance.get(`/v1/properties/${propertyId}/rooms`, { params });
    return response.data;
  },
  create: async (propertyId: string, payload: CreateRoomPayload): Promise<{ message: string; data: Room }> => {
    const response = await axiosInstance.post(`/v1/properties/${propertyId}/rooms`, payload);
    return response.data;
  },
  getById: async (id: string): Promise<{ message: string; data: Room }> => {
    const response = await axiosInstance.get(`/v1/rooms/${id}`);
    return response.data;
  },
  update: async (id: string, payload: UpdateRoomPayload): Promise<{ message: string; data: Room }> => {
    const response = await axiosInstance.patch(`/v1/rooms/${id}`, payload);
    return response.data;
  },
};
