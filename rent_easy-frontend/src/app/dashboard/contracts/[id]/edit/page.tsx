'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContract, useUpdateContract } from '@/hooks/use-contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const contractUpdateSchema = z.object({
  contractNumber: z.string().trim().min(1, 'Vui lòng nhập số hợp đồng').max(50, 'Số hợp đồng không quá 50 ký tự'),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  monthlyRent: z.coerce.number().min(0, 'Giá thuê không được âm'),
  depositAmount: z.coerce.number().min(0, 'Tiền cọc không được âm'),
  note: z.string().max(2000, 'Ghi chú không quá 2000 ký tự').optional().nullable(),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"],
});

type ContractUpdateFormValues = z.infer<typeof contractUpdateSchema>;

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { data, isLoading, error } = useContract(contractId);
  const updateContractMutation = useUpdateContract();

  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<ContractUpdateFormValues>({
    resolver: zodResolver(contractUpdateSchema),
    defaultValues: {
      contractNumber: '',
      startDate: '',
      endDate: '',
      monthlyRent: 0,
      depositAmount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (data?.data) {
      const contract = data.data;
      reset({
        contractNumber: contract.contractNumber,
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
        monthlyRent: Number(contract.monthlyRent),
        depositAmount: Number(contract.depositAmount),
        note: contract.note || '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: ContractUpdateFormValues) => {
    try {
      setGlobalError(null);
      
      if (!isDirty || Object.keys(dirtyFields).length === 0) {
        setGlobalError('Không có trường nào thay đổi để cập nhật.');
        return;
      }

      // Only send fields that are actually dirty
      const payload: any = {};
      if (dirtyFields.contractNumber) payload.contractNumber = formData.contractNumber;
      if (dirtyFields.startDate) payload.startDate = new Date(formData.startDate).toISOString();
      if (dirtyFields.endDate) payload.endDate = new Date(formData.endDate).toISOString();
      if (dirtyFields.monthlyRent) payload.monthlyRent = formData.monthlyRent;
      if (dirtyFields.depositAmount) payload.depositAmount = formData.depositAmount;
      if (dirtyFields.note) payload.note = formData.note;

      await updateContractMutation.mutateAsync({ id: contractId, payload });
      router.replace('/dashboard/contracts');
    } catch (error: any) {
      const errRes = error.response?.data;
      setGlobalError(errRes?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error ? (error as any).response?.data?.message || 'Có lỗi xảy ra.' : 'Không tìm thấy hợp đồng.'}
        </div>
      </div>
    );
  }

  const contract = data.data;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Cập Nhật Hợp Đồng</CardTitle>
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
                <Label>Khu trọ</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {contract.property.name}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phòng</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {contract.room.code}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Khách thuê</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                {contract.tenant.fullName}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractNumber">Số Hợp Đồng *</Label>
              <Input id="contractNumber" {...register('contractNumber')} />
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

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú (Không bắt buộc)</Label>
              <textarea
                id="note"
                {...register('note')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Thông tin thêm..."
              />
              {errors.note && <p className="text-sm text-red-500">{errors.note.message}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={updateContractMutation.isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateContractMutation.isPending || !isDirty}>
                {updateContractMutation.isPending ? 'Đang cập nhật...' : 'Cập Nhật Hợp Đồng'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
