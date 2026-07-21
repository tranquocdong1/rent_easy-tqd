'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getPayments } from '@/services/api/payments';
import { PaymentQuery, PaymentStatus, PaymentMethod } from '@/types/payment';
import { propertiesApi } from '@/services/api/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const getBadgeClass = () => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'PENDING': return 'Đang xử lý';
      case 'COMPLETED': return 'Đã thanh toán';
      case 'FAILED': return 'Thất bại';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass()}`}>
      {getLabel()}
    </span>
  );
}

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const getLabel = () => {
    switch (method) {
      case 'CASH': return 'Tiền mặt';
      case 'BANK_TRANSFER': return 'Chuyển khoản';
      case 'CREDIT_CARD': return 'Thẻ tín dụng';
      default: return method;
    }
  };

  return (
    <span className="text-sm text-muted-foreground font-medium">
      {getLabel()}
    </span>
  );
}

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [query, setQuery] = useState<PaymentQuery>({
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
    sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as PaymentStatus) || undefined,
    paymentMethod: (searchParams.get('paymentMethod') as PaymentMethod) || undefined,
    propertyId: searchParams.get('propertyId') || undefined,
    billingMonth: searchParams.get('billingMonth') ? Number(searchParams.get('billingMonth')) : undefined,
    billingYear: searchParams.get('billingYear') ? Number(searchParams.get('billingYear')) : undefined,
  });

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.page && query.page > 1) params.set('page', query.page.toString());
    if (query.limit && query.limit !== 10) params.set('limit', query.limit.toString());
    if (query.sortBy && query.sortBy !== 'createdAt') params.set('sortBy', query.sortBy);
    if (query.sortOrder && query.sortOrder !== 'desc') params.set('sortOrder', query.sortOrder);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.paymentMethod) params.set('paymentMethod', query.paymentMethod);
    if (query.propertyId) params.set('propertyId', query.propertyId);
    if (query.billingMonth) params.set('billingMonth', query.billingMonth.toString());
    if (query.billingYear) params.set('billingYear', query.billingYear.toString());

    router.replace(`${pathname}?${params.toString()}`);
  }, [query, pathname, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', query],
    queryFn: () => getPayments(query),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll({ limit: 100 }),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleSort = (field: string) => {
    setQuery((prev) => ({
      ...prev,
      sortBy: field as any,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (data?.data?.meta && newPage >= 1 && newPage <= data.data.meta.totalPages) {
      setQuery((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Lịch sử Thanh toán</h1>
        <Link href="/dashboard/payments/new" passHref>
          <Button>+ Thêm Thanh toán</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <Label htmlFor="search" className="sr-only">Tìm kiếm</Label>
          <Input 
            id="search" 
            placeholder="Tìm mã biên lai, mã hóa đơn, khách thuê..." 
            value={query.search || ''} 
            onChange={handleSearchChange}
          />
        </div>
        
        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.status || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, status: e.target.value as PaymentStatus || undefined, page: 1 }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="COMPLETED">Đã thanh toán</option>
            <option value="FAILED">Thất bại</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.paymentMethod || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod || undefined, page: 1 }))}
          >
            <option value="">Tất cả PTTT</option>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="CREDIT_CARD">Thẻ tín dụng</option>
          </select>
        </div>

        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.propertyId || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, propertyId: e.target.value || undefined, page: 1 }))}
          >
            <option value="">Tất cả khu trọ</option>
            {propertiesData?.data?.items?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.billingMonth || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, billingMonth: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">Tháng</option>
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}</option>
            ))}
          </select>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.billingYear || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, billingYear: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">Năm</option>
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 font-medium border-b">
            <tr>
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => handleSort('paymentDate')}>
                Payment Date {query.sortBy === 'paymentDate' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted text-right" onClick={() => handleSort('amount')}>
                Amount {query.sortBy === 'amount' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-red-500">
                  Lỗi tải danh sách thanh toán.
                </td>
              </tr>
            ) : data?.data?.items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              data?.data?.items.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-primary">
                    {payment.receiptNumber}
                  </td>
                  <td className="px-4 py-3 text-blue-600 hover:underline">
                    <Link href={`/dashboard/invoices/${payment.invoiceNumber}`}>
                      {payment.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{payment.tenantName}</td>
                  <td className="px-4 py-3 font-medium">{payment.roomCode}</td>
                  <td className="px-4 py-3">{payment.propertyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(payment.paymentDate).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{payment.amount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={payment.paymentMethod} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.data?.meta && data.data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {(data.data.meta.currentPage - 1) * data.data.meta.itemsPerPage + 1} đến {Math.min(data.data.meta.currentPage * data.data.meta.itemsPerPage, data.data.meta.totalItems)} của {data.data.meta.totalItems} kết quả
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(data.data.meta.currentPage - 1)}
              disabled={data.data.meta.currentPage === 1}
            >
              Trước
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(data.data.meta.currentPage + 1)}
              disabled={data.data.meta.currentPage === data.data.meta.totalPages}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}
