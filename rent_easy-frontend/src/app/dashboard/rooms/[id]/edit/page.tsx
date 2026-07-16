'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { roomsApi, UpdateRoomPayload } from '@/services/api/rooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Note: No status field in update schema
const roomUpdateSchema = z.object({
  code: z.string().trim().min(3, 'Mã phòng phải từ 3 ký tự trở lên').max(50, 'Mã phòng không quá 50 ký tự').toUpperCase(),
  name: z.string().trim().min(3, 'Tên phòng phải từ 3 ký tự trở lên').max(150, 'Tên phòng không quá 150 ký tự'),
  floor: z.number().int().optional().or(z.nan()).transform(val => isNaN(val as number) ? undefined : val),
  area: z.number({ required_error: 'Vui lòng nhập diện tích' }).min(0.01, 'Diện tích phải lớn hơn 0'),
  capacity: z.number({ required_error: 'Vui lòng nhập sức chứa' }).int().min(1, 'Sức chứa tối thiểu là 1'),
  rentPrice: z.number({ required_error: 'Vui lòng nhập giá thuê' }).min(0, 'Giá thuê không được âm'),
  deposit: z.number({ required_error: 'Vui lòng nhập giá cọc' }).min(0, 'Giá cọc không được âm'),
  description: z.string().trim().max(2000, 'Mô tả không quá 2000 ký tự').optional(),
});

type RoomUpdateFormValues = z.infer<typeof roomUpdateSchema>;

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<RoomUpdateFormValues>({
    resolver: zodResolver(roomUpdateSchema),
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await roomsApi.getById(roomId);
        const data = res.data;
        reset({
          code: data.code,
          name: data.name,
          floor: data.floor || undefined,
          area: data.area,
          capacity: data.capacity,
          rentPrice: data.rentPrice,
          deposit: data.deposit,
          // description is missing in standard response unless we add it, but it's optional
          // We can mock description fetch if backend returns it, wait backend doesn't return description in RoomResponseDto.
          // In full implementation, we'd add it to RoomResponseDto or RoomDetailDto.
        });
      } catch (error) {
        setGlobalError('Không thể tải thông tin phòng.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoom();
  }, [roomId, reset]);

  const onSubmit = async (data: RoomUpdateFormValues) => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);
      await roomsApi.update(roomId, data);
      router.back(); // Go back to room list or detail
      router.refresh();
    } catch (error: any) {
      if (error.response?.data?.code === 'NO_FIELDS_TO_UPDATE') {
        setGlobalError('Không có thông tin nào được thay đổi.');
      } else if (error.response?.data?.code === 'ROOM_ALREADY_EXISTS') {
        setError('code', { message: error.response.data.message });
      } else {
        setGlobalError(error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cập nhật Phòng</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa thông tin</CardTitle>
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
                {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
