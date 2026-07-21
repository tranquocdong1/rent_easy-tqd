'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContractService } from '@/services/contract.service';
import { createInvoice } from '@/services/api/invoices';
import { ContractStatus } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const invoiceSchema = z.object({
  contractId: z.string().min(1, 'Vui lòng chọn hợp đồng'),
  billingMonth: z.number().min(1).max(12),
  billingYear: z.number().min(2000),
  issueDate: z.string().min(1, 'Vui lòng chọn ngày lập hóa đơn'),
  dueDate: z.string().min(1, 'Vui lòng chọn ngày đến hạn'),
  electricityAmount: z.number().min(0),
  waterAmount: z.number().min(0),
  serviceAmount: z.number().min(0),
  otherAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  note: z.string().optional(),
}).refine((data) => new Date(data.issueDate) <= new Date(data.dueDate), {
  message: 'Ngày lập không được lớn hơn ngày đến hạn',
  path: ['issueDate'],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function CreateInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch active contracts
  const { data: contractsData, isLoading: isLoadingContracts } = useQuery({
    queryKey: ['contracts', 'active'],
    queryFn: () => ContractService.getContracts({ limit: 100, status: ContractStatus.ACTIVE }),
  });

  const contracts = contractsData?.data?.items || [];

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contractId: '',
      billingMonth: new Date().getMonth() + 1,
      billingYear: new Date().getFullYear(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      electricityAmount: 0,
      waterAmount: 0,
      serviceAmount: 0,
      otherAmount: 0,
      discountAmount: 0,
      note: '',
    },
  });

  const contractId = useWatch({ control: form.control, name: 'contractId' });
  const electricityAmount = useWatch({ control: form.control, name: 'electricityAmount' }) || 0;
  const waterAmount = useWatch({ control: form.control, name: 'waterAmount' }) || 0;
  const serviceAmount = useWatch({ control: form.control, name: 'serviceAmount' }) || 0;
  const otherAmount = useWatch({ control: form.control, name: 'otherAmount' }) || 0;
  const discountAmount = useWatch({ control: form.control, name: 'discountAmount' }) || 0;

  const selectedContract = useMemo(() => {
    return contracts.find(c => c.id === contractId);
  }, [contracts, contractId]);

  const totalAmount = useMemo(() => {
    const roomRent = selectedContract?.monthlyRent || 0;
    return roomRent + electricityAmount + waterAmount + serviceAmount + otherAmount - discountAmount;
  }, [selectedContract, electricityAmount, waterAmount, serviceAmount, otherAmount, discountAmount]);

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      // Toast success could go here if we had a toast library setup
      alert('Tạo hóa đơn thành công!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      router.push('/dashboard/invoices');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn';
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const onSubmit = (values: InvoiceFormValues) => {
    setErrorMsg(null);
    mutation.mutate({
      ...values,
      issueDate: new Date(values.issueDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tạo Hóa đơn mới</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
          Hủy bỏ
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cột trái: Thông tin chung */}
          <div className="space-y-6 bg-white p-6 rounded-md border">
            <h2 className="text-xl font-semibold mb-4">Thông tin chung</h2>
            
            <div className="space-y-2">
              <Label>Hợp đồng *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                {...form.register('contractId')}
                disabled={isLoadingContracts}
              >
                <option value="">-- Chọn hợp đồng --</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber} - {c.tenantName} ({c.roomCode})
                  </option>
                ))}
              </select>
              {form.formState.errors.contractId && (
                <p className="text-sm text-red-500">{form.formState.errors.contractId.message}</p>
              )}
            </div>

            {selectedContract && (
              <div className="bg-muted/30 p-4 rounded-md text-sm space-y-2 border">
                <p><span className="font-medium text-muted-foreground">Khách thuê:</span> {selectedContract.tenantName}</p>
                <p><span className="font-medium text-muted-foreground">Phòng:</span> {selectedContract.roomCode}</p>
                <p><span className="font-medium text-muted-foreground">Tài sản:</span> {selectedContract.propertyName}</p>
                <p><span className="font-medium text-muted-foreground">Tiền phòng (tháng):</span> <span className="font-semibold text-primary">{Number(selectedContract.monthlyRent).toLocaleString('vi-VN')} đ</span></p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kỳ hóa đơn (Tháng) *</Label>
                <Input
                  type="number"
                  {...form.register('billingMonth', { valueAsNumber: true })}
                />
                {form.formState.errors.billingMonth && (
                  <p className="text-sm text-red-500">{form.formState.errors.billingMonth.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Kỳ hóa đơn (Năm) *</Label>
                <Input
                  type="number"
                  {...form.register('billingYear', { valueAsNumber: true })}
                />
                {form.formState.errors.billingYear && (
                  <p className="text-sm text-red-500">{form.formState.errors.billingYear.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày lập *</Label>
                <Input
                  type="date"
                  {...form.register('issueDate')}
                />
                {form.formState.errors.issueDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.issueDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ngày đến hạn *</Label>
                <Input
                  type="date"
                  {...form.register('dueDate')}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input
                {...form.register('note')}
                placeholder="Ví dụ: Tiền điện tháng 8..."
              />
            </div>
          </div>

          {/* Cột phải: Các khoản thu */}
          <div className="space-y-6 bg-white p-6 rounded-md border flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Các khoản phí</h2>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label>Tiền điện (đ)</Label>
                <Input
                  type="number"
                  {...form.register('electricityAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.electricityAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.electricityAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tiền nước (đ)</Label>
                <Input
                  type="number"
                  {...form.register('waterAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.waterAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.waterAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tiền dịch vụ (đ)</Label>
                <Input
                  type="number"
                  {...form.register('serviceAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.serviceAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.serviceAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Phụ phí khác (đ)</Label>
                <Input
                  type="number"
                  {...form.register('otherAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.otherAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.otherAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Giảm giá (đ)</Label>
                <Input
                  type="number"
                  {...form.register('discountAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.discountAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.discountAmount.message}</p>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20 flex justify-between items-center">
              <span className="text-lg font-bold">Tổng cộng:</span>
              <span className="text-2xl font-bold text-primary">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg" 
            disabled={mutation.isPending}
            className="w-full md:w-auto min-w-[200px]"
          >
            {mutation.isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
          </Button>
        </div>
      </form>
    </div>
  );
}
