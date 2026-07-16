'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { roomsApi } from '@/services/api/rooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const roomSchema = z.object({
  code: z.string().trim().min(3, 'Mã phòng phải từ 3 ký tự trở lên').max(50, 'Mã phòng không quá 50 ký tự').toUpperCase(),
  name: z.string().trim().min(3, 'Tên phòng phải từ 3 ký tự trở lên').max(150, 'Tên phòng không quá 150 ký tự'),
  floor: z.number().int().optional().or(z.nan()).transform(val => isNaN(val as number) ? undefined : val),
  area: z.number({ required_error: 'Vui lòng nhập diện tích' }).min(0.01, 'Diện tích phải lớn hơn 0'),
  capacity: z.number({ required_error: 'Vui lòng nhập sức chứa' }).int().min(1, 'Sức chứa tối thiểu là 1'),
  rentPrice: z.number({ required_error: 'Vui lòng nhập giá thuê' }).min(0, 'Giá thuê không được âm'),
  deposit: z.number({ required_error: 'Vui lòng nhập giá cọc' }).min(0, 'Giá cọc không được âm'),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'INACTIVE']).default('AVAILABLE'),
  description: z.string().trim().max(2000, 'Mô tả không quá 2000 ký tự').optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

export default function NewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      code: '',
      name: '',
      status: 'AVAILABLE',
      description: '',
    },
  });

  const onSubmit = async (data: RoomFormValues) => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);
      await roomsApi.create(propertyId, data);
      router.push(`/dashboard/properties/${propertyId}/rooms`);
      router.refresh();
    } catch (error: any) {
      if (error.response?.data?.code === 'ROOM_ALREADY_EXISTS') {
        setError('code', { message: error.response.data.message });
      } else {
        setGlobalError(error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Thêm Phòng Mới</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin chi tiết phòng</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {globalError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã phòng <span className="text-red-500">*</span></Label>
                <Input id="code" placeholder="VD: P101, A1" {...register('code')} />
                {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Tên phòng <span className="text-red-500">*</span></Label>
                <Input id="name" placeholder="Phòng 101" {...register('name')} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Tầng</Label>
                <Input id="floor" type="number" {...register('floor', { valueAsNumber: true })} />
                {errors.floor && <p className="text-red-500 text-sm">{errors.floor.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Diện tích (m2) <span className="text-red-500">*</span></Label>
                <Input id="area" type="number" step="0.01" {...register('area', { valueAsNumber: true })} />
                {errors.area && <p className="text-red-500 text-sm">{errors.area.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Sức chứa <span className="text-red-500">*</span></Label>
                <Input id="capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
                {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentPrice">Giá thuê (VND) <span className="text-red-500">*</span></Label>
                <Input id="rentPrice" type="number" {...register('rentPrice', { valueAsNumber: true })} />
                {errors.rentPrice && <p className="text-red-500 text-sm">{errors.rentPrice.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Giá cọc (VND) <span className="text-red-500">*</span></Label>
                <Input id="deposit" type="number" {...register('deposit', { valueAsNumber: true })} />
                {errors.deposit && <p className="text-red-500 text-sm">{errors.deposit.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('status')}
              >
                <option value="AVAILABLE">Phòng trống (Mặc định)</option>
                <option value="MAINTENANCE">Bảo trì</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
              {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Thông tin thêm về phòng..."
                {...register('description')}
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Lưu lại'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
