'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getInvoiceById } from '@/services/api/invoices';
import { InvoiceStatus } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const getBadgeClass = () => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'UNPAID': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      case 'CANCELLED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'UNPAID': return 'Chưa thanh toán';
      case 'PARTIALLY_PAID': return 'Thanh toán một phần';
      case 'PAID': return 'Đã thanh toán';
      case 'OVERDUE': return 'Quá hạn';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getBadgeClass()}`}>
      {getLabel()}
    </span>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  if (isError || !data?.data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          Không tìm thấy hóa đơn hoặc bạn không có quyền truy cập.
        </div>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/invoices')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const invoice = data.data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
            ← Quay lại
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Hóa đơn: {invoice.invoiceNumber}</h1>
          <InvoiceBadge status={invoice.status} />
        </div>
        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
          <Button variant="default">Chỉnh sửa</Button>
        </Link>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Invoice */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
          <h3 className="font-semibold text-lg border-b pb-2">Hóa Đơn</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã hóa đơn:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kỳ thanh toán:</span>
              <span className="font-medium">{invoice.billingMonth.toString().padStart(2, '0')}/{invoice.billingYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ngày lập:</span>
              <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đến hạn:</span>
              <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tenant */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg border-b pb-2">Khách Thuê</h3>
            <div className="space-y-1 text-sm mt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Họ tên:</span>
                <span className="font-medium">{invoice.tenant?.fullName || invoice.tenantName || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SĐT:</span>
                <span className="font-medium">{invoice.tenant?.phone || '---'}</span>
              </div>
            </div>
          </div>
          {/* <Link href={`/dashboard/tenants/${invoice.tenant?.id}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Xem chi tiết khách thuê →
          </Link> */}
        </div>

        {/* Card 3: Room & Property */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg border-b pb-2">Phòng Thuê</h3>
            <div className="space-y-1 text-sm mt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phòng:</span>
                <span className="font-medium">
                  {invoice.room?.code
                    ? `${invoice.room.code}${invoice.room.name ? ` - ${invoice.room.name}` : ''}`
                    : invoice.roomCode || '---'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nhà trọ:</span>
                <span className="font-medium">{invoice.property?.name || invoice.propertyName || '---'}</span>
              </div>
            </div>
          </div>
          {/* <Link href={`/dashboard/properties/${invoice.property?.id}/rooms/${invoice.room?.id}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Xem chi tiết phòng →
          </Link> */}
        </div>

        {/* Card 4: Financial Summary */}
        <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-sm space-y-3">
          <h3 className="font-semibold text-lg border-b border-primary/20 pb-2">Tóm Tắt Tài Chính</h3>
          <div className="space-y-2 text-sm mt-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tổng cộng:</span>
              <span className="font-medium">{Number(invoice.totalAmount || ((invoice.summary?.paidAmount || 0) + (invoice.summary?.remainingAmount || 0))).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span className="">Đã thanh toán:</span>
              <span className="font-medium">{Number(invoice.summary?.paidAmount ?? invoice.paidAmount ?? 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-primary/20 font-bold text-lg text-primary">
              <span>Còn lại:</span>
              <span>{Number(invoice.summary?.remainingAmount ?? invoice.remainingAmount ?? 0).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="details">Chi tiết khoản thu</TabsTrigger>
          <TabsTrigger value="payments">Lịch sử thanh toán</TabsTrigger>
          <TabsTrigger value="history">Lịch sử thay đổi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Khoản mục</th>
                  <th className="px-6 py-4 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">Tiền thuê phòng</td>
                  <td className="px-6 py-4 text-right font-medium">{Number(invoice.roomRent).toLocaleString('vi-VN')} đ</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">Tiền điện</td>
                  <td className="px-6 py-4 text-right font-medium">{Number(invoice.electricityAmount).toLocaleString('vi-VN')} đ</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">Tiền nước</td>
                  <td className="px-6 py-4 text-right font-medium">{Number(invoice.waterAmount).toLocaleString('vi-VN')} đ</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">Tiền dịch vụ</td>
                  <td className="px-6 py-4 text-right font-medium">{Number(invoice.serviceAmount).toLocaleString('vi-VN')} đ</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">Phụ phí khác</td>
                  <td className="px-6 py-4 text-right font-medium">{Number(invoice.otherAmount).toLocaleString('vi-VN')} đ</td>
                </tr>
                <tr className="hover:bg-muted/50 text-red-600">
                  <td className="px-6 py-4">Giảm giá</td>
                  <td className="px-6 py-4 text-right font-medium">- {Number(invoice.discountAmount).toLocaleString('vi-VN')} đ</td>
                </tr>
              </tbody>
              <tfoot className="bg-primary/5 font-bold text-lg">
                <tr>
                  <td className="px-6 py-4">TỔNG CỘNG</td>
                  <td className="px-6 py-4 text-right text-primary">{Number(invoice.totalAmount).toLocaleString('vi-VN')} đ</td>
                </tr>
              </tfoot>
            </table>
            
            {invoice.note && (
              <div className="p-6 border-t bg-amber-50/50">
                <h4 className="font-semibold text-amber-900 mb-2">Ghi chú hóa đơn:</h4>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{invoice.note}</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-4">
          <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground shadow-sm">
            <p>Lịch sử thanh toán sẽ được cập nhật sau khi hoàn thành Module Payment.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground shadow-sm">
            <p>Lịch sử thay đổi sẽ được cập nhật sau khi hoàn thành Module Audit.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
