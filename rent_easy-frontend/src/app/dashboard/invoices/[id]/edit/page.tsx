'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoiceById, updateInvoice } from '@/services/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const invoiceSchema = z.object({
  issueDate: z.string().min(1, 'Vui lòng chọn ngày lập hóa đơn'),
  dueDate: z.string().min(1, 'Vui lòng chọn ngày đến hạn'),
  electricityAmount: z.number().min(0),
  waterAmount: z.number().min(0),
  serviceAmount: z.number().min(0),
  otherAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  note: z.string().optional().nullable(),
}).refine((data) => new Date(data.issueDate) <= new Date(data.dueDate), {
  message: 'Ngày lập không được lớn hơn ngày đến hạn',
  path: ['issueDate'],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });

  const invoice = response?.data;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issueDate: '',
      dueDate: '',
      electricityAmount: 0,
      waterAmount: 0,
      serviceAmount: 0,
      otherAmount: 0,
      discountAmount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        electricityAmount: Number(invoice.electricityAmount),
        waterAmount: Number(invoice.waterAmount),
        serviceAmount: Number(invoice.serviceAmount),
        otherAmount: Number(invoice.otherAmount),
        discountAmount: Number(invoice.discountAmount),
        note: invoice.note || '',
      });
    }
  }, [invoice, form]);

  const electricityAmount = useWatch({ control: form.control, name: 'electricityAmount' }) || 0;
  const waterAmount = useWatch({ control: form.control, name: 'waterAmount' }) || 0;
  const serviceAmount = useWatch({ control: form.control, name: 'serviceAmount' }) || 0;
  const otherAmount = useWatch({ control: form.control, name: 'otherAmount' }) || 0;
  const discountAmount = useWatch({ control: form.control, name: 'discountAmount' }) || 0;

  const totalAmount = useMemo(() => {
    const roomRent = invoice?.roomRent || 0;
    return roomRent + electricityAmount + waterAmount + serviceAmount + otherAmount - discountAmount;
  }, [invoice?.roomRent, electricityAmount, waterAmount, serviceAmount, otherAmount, discountAmount]);

  const mutation = useMutation({
    mutationFn: (values: InvoiceFormValues) => updateInvoice(id, {
      ...values,
      note: values.note || undefined,
      issueDate: new Date(values.issueDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
    }),
    onSuccess: () => {
      alert('Cập nhật hóa đơn thành công!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      router.push('/dashboard/invoices');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hóa đơn';
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const onSubmit = (values: InvoiceFormValues) => {
    // Only submit if form is dirty
    if (!form.formState.isDirty) {
      router.push('/dashboard/invoices');
      return;
    }
    setErrorMsg(null);
    mutation.mutate(values);
  };

  if (isLoading) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  if (isError || !invoice) {
    return <div className="p-6 text-red-500">Không tìm thấy hóa đơn hoặc có lỗi xảy ra.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Cập nhật Hóa đơn</h1>
          <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-semibold rounded-full border">
            {invoice.invoiceNumber}
          </span>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${
            invoice.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
            invoice.status === 'UNPAID' ? 'bg-orange-100 text-orange-700 border-orange-200' :
            invoice.status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-700 border-blue-200' :
            invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {invoice.status}
          </span>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
          Quay lại
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}

      {invoice.status !== 'UNPAID' && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200 mb-6">
          Hóa đơn này không ở trạng thái Chưa thanh toán, bạn không thể cập nhật.
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cột trái: Thông tin Readonly & General */}
          <div className="space-y-6 bg-white p-6 rounded-md border">
            <h2 className="text-xl font-semibold mb-4">Thông tin chung</h2>
            
            <div className="bg-muted/30 p-4 rounded-md text-sm space-y-3 border">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium text-muted-foreground">Kỳ hóa đơn:</span> {invoice.billingPeriod}</div>
                <div><span className="font-medium text-muted-foreground">Khách thuê:</span> {invoice.tenantName}</div>
                <div><span className="font-medium text-muted-foreground">Phòng:</span> {invoice.roomCode}</div>
                <div><span className="font-medium text-muted-foreground">Tài sản:</span> {invoice.propertyName}</div>
              </div>
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground">Tiền phòng cố định: </span>
                <span className="font-semibold text-primary">{Number(invoice.roomRent).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày lập *</Label>
                <Input
                  type="date"
                  {...form.register('issueDate')}
                  disabled={invoice.status !== 'UNPAID'}
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
                  disabled={invoice.status !== 'UNPAID'}
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
                placeholder="Ví dụ: Điều chỉnh tiền nước..."
                disabled={invoice.status !== 'UNPAID'}
              />
            </div>
          </div>

          {/* Cột phải: Các khoản thu Editable */}
          <div className="space-y-6 bg-white p-6 rounded-md border flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Các khoản phí</h2>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label>Tiền điện (đ)</Label>
                <Input
                  type="number"
                  {...form.register('electricityAmount', { valueAsNumber: true })}
                  disabled={invoice.status !== 'UNPAID'}
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
                  disabled={invoice.status !== 'UNPAID'}
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
                  disabled={invoice.status !== 'UNPAID'}
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
                  disabled={invoice.status !== 'UNPAID'}
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
                  disabled={invoice.status !== 'UNPAID'}
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

        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            size="lg" 
            disabled={mutation.isPending || invoice.status !== 'UNPAID' || !form.formState.isDirty}
            className="w-full md:w-auto min-w-[200px]"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
