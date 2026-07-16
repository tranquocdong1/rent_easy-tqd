'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { propertiesApi } from '@/services/api/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const propertySchema = z.object({
  name: z.string().trim().min(3, 'Tên phải từ 3 ký tự trở lên').max(150, 'Tên không quá 150 ký tự'),
  propertyType: z.enum(['HOUSE', 'BOARDING_HOUSE', 'MINI_APARTMENT', 'OTHER'], {
    required_error: 'Vui lòng chọn loại hình',
  }),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ').max(500, 'Địa chỉ không quá 500 ký tự'),
  description: z.string().trim().max(2000, 'Mô tả không quá 2000 ký tự').optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      propertyType: 'HOUSE',
      status: 'ACTIVE',
      address: '',
      description: '',
    },
  });

  const onSubmit = async (data: PropertyFormValues) => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);
      await propertiesApi.create({
        ...data,
        description: data.description || undefined,
      });
      // Success: redirect using replace to avoid going back to the form
      router.replace('/dashboard/properties');
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 'PROPERTY_ALREADY_EXISTS') {
        setError('name', { type: 'manual', message: errRes.message });
      } else {
        setGlobalError(errRes?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Thêm Mới Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                {globalError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Tên Property *</Label>
              <Input id="name" {...register('name')} placeholder="Ví dụ: Nhà Nguyễn Trãi" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Loại hình *</Label>
                <select
                  id="propertyType"
                  {...register('propertyType')}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="HOUSE">Nhà nguyên căn</option>
                  <option value="BOARDING_HOUSE">Dãy trọ</option>
                  <option value="MINI_APARTMENT">Chung cư mini</option>
                  <option value="OTHER">Khác</option>
                </select>
                {errors.propertyType && <p className="text-sm text-red-500">{errors.propertyType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
                {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ *</Label>
              <Input id="address" {...register('address')} placeholder="Nhập địa chỉ đầy đủ" />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả thêm (Không bắt buộc)</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Thông tin thêm..."
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu Property'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
