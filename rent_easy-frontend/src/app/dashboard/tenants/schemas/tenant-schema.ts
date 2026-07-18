import { z } from 'zod';
import { Gender } from '@/types/tenant';

export const createTenantSchema = z.object({
  fullName: z.string().trim().min(1, 'Họ tên không được để trống'),
  gender: z.nativeEnum(Gender).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  identityNumber: z.string().trim().regex(/^(\d{9}|\d{12})$/, 'CCCD/CMND phải là 9 hoặc 12 số'),
  identityIssuedDate: z.string().optional().nullable(),
  identityIssuedPlace: z.string().trim().optional().nullable(),
  phone: z.string().trim().regex(/^\d{10,11}$/, 'Số điện thoại phải từ 10-11 số').optional().nullable().or(z.literal('')),
  email: z.string().trim().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  permanentAddress: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>;
