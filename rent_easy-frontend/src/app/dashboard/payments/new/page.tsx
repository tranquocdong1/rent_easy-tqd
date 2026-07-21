'use client';

import { useState } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getInvoices } from '@/services/api/invoices';
import { createPayment } from '@/services/api/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { PaymentMethod } from '@/types/payment';
import { InvoiceStatus } from '@/types/invoice';

const formSchema = z.object({
  invoiceId: z.string().min(1, 'Vui lòng chọn hóa đơn'),
  paymentDate: z.string().min(1, 'Vui lòng chọn ngày thanh toán'),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD']),
  referenceNumber: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  note: z.string().max(1000, 'Tối đa 1000 ký tự').optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePaymentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices', 'pending'],
    queryFn: () => getInvoices({ statuses: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID], limit: 100 }),
  });

  const invoices = invoicesData?.data?.items || [];
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useHookForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 16),
      amount: 0,
      paymentMethod: 'CASH',
      referenceNumber: '',
      note: '',
    }
  });

  // Watch for validation
  const amount = watch('amount');

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      alert('Tạo thanh toán thành công!');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (selectedInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ['invoice', selectedInvoiceId] });
      }
      router.push('/dashboard/payments');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán';
      alert(msg);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (selectedInvoice && data.amount > selectedInvoice.remainingAmount) {
      alert('Số tiền thanh toán không được lớn hơn số tiền còn lại của hóa đơn.');
      return;
    }
    
    createMutation.mutate({
      ...data,
      paymentDate: new Date(data.paymentDate).toISOString(),
    });
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedInvoiceId(val);
    setValue('invoiceId', val, { shouldValidate: true });
    
    // Auto fill remaining amount
    const inv = invoices.find(i => i.id === val);
    if (inv) {
      setValue('amount', inv.remainingAmount, { shouldValidate: true });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Thêm Thanh Toán</h1>
        <Link href="/dashboard/payments">
          <Button variant="outline">Hủy</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Hóa đơn <span className="text-red-500">*</span></Label>
            <select 
              id="invoiceId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={selectedInvoiceId}
              onChange={handleInvoiceChange}
            >
              <option value="">-- Chọn hóa đơn chưa thanh toán --</option>
              {isLoadingInvoices ? (
                <option value="" disabled>Đang tải...</option>
              ) : (
                invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.tenantName} - {inv.roomCode}
                  </option>
                ))
              )}
            </select>
            {errors.invoiceId && <p className="text-sm text-red-500">{errors.invoiceId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Ngày thanh toán <span className="text-red-500">*</span></Label>
            <Input 
              id="paymentDate" 
              type="datetime-local" 
              {...register('paymentDate')} 
            />
            {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền (VNĐ) <span className="text-red-500">*</span></Label>
            <Input 
              id="amount" 
              type="number" 
              {...register('amount')} 
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            {selectedInvoice && amount > selectedInvoice.remainingAmount && (
              <p className="text-sm text-amber-600">Lưu ý: Số tiền thanh toán đang lớn hơn số tiền còn lại của hóa đơn.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Phương thức thanh toán <span className="text-red-500">*</span></Label>
            <select 
              id="paymentMethod"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('paymentMethod')}
            >
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="CREDIT_CARD">Thẻ tín dụng</option>
            </select>
            {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Mã giao dịch / Tham chiếu</Label>
            <Input 
              id="referenceNumber" 
              placeholder="VD: FT240815123456" 
              {...register('referenceNumber')} 
            />
            {errors.referenceNumber && <p className="text-sm text-red-500">{errors.referenceNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea 
              id="note" 
              placeholder="Ghi chú thêm..." 
              {...register('note')} 
            />
            {errors.note && <p className="text-sm text-red-500">{errors.note.message}</p>}
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createMutation.isPending || !selectedInvoiceId}
            >
              {createMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Thanh toán'}
            </Button>
          </div>
        </form>

        {/* Invoice Summary Card */}
        <div className="space-y-4">
          {selectedInvoice ? (
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg border-b border-primary/20 pb-2 text-primary">Thông tin Hóa đơn</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã hóa đơn:</span>
                  <span className="font-bold">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kỳ thanh toán:</span>
                  <span className="font-medium">{selectedInvoice.billingPeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạn thanh toán:</span>
                  <span className="font-medium text-red-600">{new Date(selectedInvoice.dueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <hr className="border-primary/10 my-2" />
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách thuê:</span>
                  <span className="font-medium">{selectedInvoice.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khu trọ:</span>
                  <span className="font-medium">{selectedInvoice.propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phòng:</span>
                  <span className="font-medium">{selectedInvoice.roomCode}</span>
                </div>

                <hr className="border-primary/10 my-2" />

                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground font-semibold">Tổng cộng:</span>
                  <span className="font-bold">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Đã thanh toán:</span>
                  <span className="font-bold">{selectedInvoice.paidAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary/20 text-lg font-bold text-red-600">
                  <span>Còn lại cần thu:</span>
                  <span>{selectedInvoice.remainingAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 h-full flex flex-col items-center justify-center min-h-[300px]">
              <p>Vui lòng chọn Hóa đơn để xem thông tin chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
