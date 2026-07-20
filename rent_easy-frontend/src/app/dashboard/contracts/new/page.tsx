'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateContract } from '@/hooks/use-contracts';
import { propertiesApi } from '@/services/api/properties';
import { roomsApi } from '@/services/api/rooms';
import { tenantsApi } from '@/services/api/tenant';
import { Property } from '@/types/property';
import { Room } from '@/types/room';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const contractSchema = z.object({
  propertyId: z.string().min(1, 'Vui lòng chọn khu trọ'),
  roomId: z.string().min(1, 'Vui lòng chọn phòng'),
  tenantId: z.string().min(1, 'Vui lòng chọn khách thuê'),
  contractNumber: z.string().trim().min(1, 'Vui lòng nhập số hợp đồng').max(50, 'Số hợp đồng không quá 50 ký tự'),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  monthlyRent: z.coerce.number().min(0, 'Giá thuê không được âm'),
  depositAmount: z.coerce.number().min(0, 'Tiền cọc không được âm'),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"],
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function NewContractPage() {
  const router = useRouter();
  const createContractMutation = useCreateContract();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      propertyId: '',
      roomId: '',
      tenantId: '',
      contractNumber: `HD-${new Date().getTime().toString().slice(-6)}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      monthlyRent: 0,
      depositAmount: 0,
    },
  });

  const selectedPropertyId = watch('propertyId');
  const selectedRoomId = watch('roomId');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [propsRes, tenantsRes] = await Promise.all([
          propertiesApi.getAll({ limit: 1000 }),
          tenantsApi.getAll({ limit: 1000 }),
        ]);
        setProperties(propsRes.data.items);
        setTenants(tenantsRes.data.items);
      } catch (error) {
        console.error('Failed to load initial data', error);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      roomsApi.getAllByProperty(selectedPropertyId, { limit: 100, status: 'AVAILABLE' }).then((res) => {
        setRooms(res.data.items);
      }).catch(console.error);
      
      setValue('roomId', '');
    } else {
      setRooms([]);
    }
  }, [selectedPropertyId, setValue]);

  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find(r => r.id === selectedRoomId);
      if (room) {
        setValue('monthlyRent', room.rentPrice);
        setValue('depositAmount', room.deposit);
      }
    }
  }, [selectedRoomId, rooms, setValue]);

  const onSubmit = async (data: ContractFormValues) => {
    try {
      setGlobalError(null);
      const payload = {
        tenantId: data.tenantId,
        roomId: data.roomId,
        contractNumber: data.contractNumber,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
      };

      await createContractMutation.mutateAsync(payload);
      router.push('/dashboard/contracts');
    } catch (error: any) {
      const errRes = error.response?.data;
      setGlobalError(errRes?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  if (loadingInitial) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Tạo Hợp Đồng Mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                {globalError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Khu trọ *</Label>
                <select
                  id="propertyId"
                  {...register('propertyId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Chọn Khu Trọ --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.propertyId && <p className="text-sm text-red-500">{errors.propertyId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Phòng *</Label>
                <select
                  id="roomId"
                  {...register('roomId')}
                  disabled={!selectedPropertyId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">-- Chọn Phòng Trống --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.code}</option>
                  ))}
                </select>
                {errors.roomId && <p className="text-sm text-red-500">{errors.roomId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Khách thuê *</Label>
              <select
                id="tenantId"
                {...register('tenantId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Chọn Khách Thuê --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} {t.phone ? `- ${t.phone}` : ''}</option>
                ))}
              </select>
              {errors.tenantId && <p className="text-sm text-red-500">{errors.tenantId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractNumber">Số Hợp Đồng *</Label>
              <Input id="contractNumber" {...register('contractNumber')} placeholder="Ví dụ: HD-123456" />
              {errors.contractNumber && <p className="text-sm text-red-500">{errors.contractNumber.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc *</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Tiền thuê hàng tháng (VNĐ) *</Label>
                <Input id="monthlyRent" type="number" {...register('monthlyRent')} min={0} />
                {errors.monthlyRent && <p className="text-sm text-red-500">{errors.monthlyRent.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount">Tiền cọc (VNĐ) *</Label>
                <Input id="depositAmount" type="number" {...register('depositAmount')} min={0} />
                {errors.depositAmount && <p className="text-sm text-red-500">{errors.depositAmount.message}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={createContractMutation.isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={createContractMutation.isPending}>
                {createContractMutation.isPending ? 'Đang tạo...' : 'Tạo Hợp Đồng'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
