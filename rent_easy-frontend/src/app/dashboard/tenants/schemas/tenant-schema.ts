import { z } from 'zod';
import { Gender } from '@/types/tenant';

const isNotFuture = (val: string | null | undefined) => {
  if (!val) return true;
  const date = new Date(val);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};

export const createTenantSchema = z.object({
  fullName: z.string().trim().min(1, 'Họ tên không được để trống'),
  gender: z.nativeEnum(Gender).optional().nullable(),
  dateOfBirth: z.string().optional().nullable().refine(isNotFuture, 'Ngày sinh không được ở tương lai'),
  identityNumber: z.string().trim().regex(/^(\d{9}|\d{12})$/, 'CCCD/CMND phải là 9 hoặc 12 số'),
  identityIssuedDate: z.string().optional().nullable().refine(isNotFuture, 'Ngày cấp không được ở tương lai'),
  identityIssuedPlace: z.string().trim().optional().nullable(),
  phone: z.string().trim().regex(/^\d{10,11}$/, 'Số điện thoại phải từ 10-11 số').optional().nullable().or(z.literal('')),
  email: z.string().trim().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  permanentAddress: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

