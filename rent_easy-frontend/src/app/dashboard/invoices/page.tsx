'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getInvoices } from '@/services/api/invoices';
import { InvoiceQuery, InvoiceStatus } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const getBadgeClass = () => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'UNPAID': return 'bg-orange-100 text-orange-700';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass()}`}>
      {getLabel()}
    </span>
  );
}

function InvoicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [query, setQuery] = useState<InvoiceQuery>({
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as InvoiceStatus) || undefined,
    month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
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
    if (query.month) params.set('month', query.month.toString());
    if (query.year) params.set('year', query.year.toString());

    router.replace(`${pathname}?${params.toString()}`);
  }, [query, pathname, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', query],
    queryFn: () => getInvoices(query),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleSort = (field: string) => {
    setQuery((prev) => ({
      ...prev,
      sortBy: field,
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
        <h1 className="text-3xl font-bold tracking-tight">Danh sách Hóa đơn</h1>
        <Link href="/dashboard/invoices/new" passHref>
          <Button>+ Tạo Hóa đơn</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search" className="sr-only">Tìm kiếm</Label>
          <Input 
            id="search" 
            placeholder="Tìm mã hóa đơn, phòng, khách thuê..." 
            value={query.search || ''} 
            onChange={handleSearchChange}
          />
        </div>
        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.status || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, status: e.target.value as InvoiceStatus || undefined, page: 1 }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PARTIALLY_PAID">Thanh toán 1 phần</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.month || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, month: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">Tất cả tháng</option>
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
        </div>
        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.year || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">Tất cả năm</option>
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 font-medium border-b">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => handleSort('invoiceNumber')}>
                Invoice No {query.sortBy === 'invoiceNumber' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Billing Period</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => handleSort('dueDate')}>
                Due Date {query.sortBy === 'dueDate' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted text-right" onClick={() => handleSort('totalAmount')}>
                Total {query.sortBy === 'totalAmount' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-red-500">
                  Lỗi tải danh sách hóa đơn.
                </td>
              </tr>
            ) : data?.data?.items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              data?.data?.items.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="hover:underline text-primary">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{invoice.tenantName}</td>
                  <td className="px-4 py-3 font-medium">{invoice.roomCode}</td>
                  <td className="px-4 py-3">{invoice.propertyName}</td>
                  <td className="px-4 py-3">{invoice.billingPeriod}</td>
                  <td className="px-4 py-3">{new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">{invoice.totalAmount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3 text-right">{invoice.remainingAmount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3">
                    <InvoiceBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="text-amber-600 hover:underline">
                      Sửa
                    </Link>
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                      Chi tiết
                    </Link>
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoicesPageContent />
    </Suspense>
  );
}
