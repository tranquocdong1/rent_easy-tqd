export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface Tenant {
  id: string;
  fullName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  identityNumber: string;
  identityIssuedDate?: string | null;
  identityIssuedPlace?: string | null;
  phone?: string | null;
  email?: string | null;
  permanentAddress?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'fullName' | 'identityNumber';
  sortOrder?: 'asc' | 'desc';
  gender?: Gender;
  hasActiveContract?: boolean;
}
