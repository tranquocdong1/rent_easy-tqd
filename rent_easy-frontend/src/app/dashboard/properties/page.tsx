'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { propertiesApi } from '@/services/api/properties';
import { Property, PropertyQuery, PaginatedResponse } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Ensure standard HTML table styles via Tailwind
function PropertiesPageContent() {
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<PropertyQuery>({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    search: '',
    status: undefined,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await propertiesApi.getAll(query);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await propertiesApi.remove(deleteId);
      setDeleteId(null);
      fetchProperties();
    } catch (error: any) {
      const errRes = error.response?.data;
      setDeleteError(errRes?.message || 'Có lỗi xảy ra khi xóa Property');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Danh sách Property</h1>
        <Link href="/dashboard/properties/new" passHref>
          <Button>+ Thêm Mới</Button>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-1/3">
          <Label htmlFor="search" className="sr-only">Tìm kiếm</Label>
          <Input 
            id="search" 
            placeholder="Tìm theo tên..." 
            value={query.search || ''} 
            onChange={handleSearchChange}
          />
        </div>
        <div>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query.status || ''} 
            onChange={(e) => setQuery(prev => ({ ...prev, status: e.target.value as any || undefined, page: 1 }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 font-medium border-b">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                Tên {query.sortBy === 'name' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Số phòng</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => handleSort('updatedAt')}>
                Cập nhật lần cuối {query.sortBy === 'updatedAt' && (query.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : data?.data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              data?.data?.items.map((property) => (
                <tr key={property.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{property.name}</td>
                  <td className="px-4 py-3">{property.propertyType}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{property.roomCount}</td>
                  <td className="px-4 py-3">{new Date(property.updatedAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <Link href={`/dashboard/properties/${property.id}/edit`} className="text-blue-600 hover:underline">
                      Sửa
                    </Link>
                    <button
                      onClick={() => setDeleteId(property.id)}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Xóa
                    </button>
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Property</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa Property này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
            {deleteError && (
              <p className="text-sm text-red-500 mt-2">{deleteError}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertiesPageContent />
    </Suspense>
  );
}
