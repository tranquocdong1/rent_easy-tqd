'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { roomsApi } from '@/services/api/rooms';
import { Room, RoomQuery } from '@/types/room';
import { PaginatedResponse } from '@/types/property'; // Reusing paginated response
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

export default function RoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const [data, setData] = useState<PaginatedResponse<Room> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<RoomQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    status: undefined,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roomsApi.getAllByProperty(propertyId, query);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, query]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    setQuery((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await roomsApi.remove(deleteId);
      setDeleteId(null);
      fetchRooms();
    } catch (error: any) {
      if (error.response?.data?.code === 'ROOM_IN_USE') {
        setDeleteError('Phòng đang được sử dụng, không thể xóa.');
      } else {
        setDeleteError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Danh sách Phòng</h1>
        <Button asChild>
          <Link href={`/dashboard/properties/${propertyId}/rooms/new`}>Tạo phòng mới</Link>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="space-y-1 flex-1 max-w-sm">
            <Label htmlFor="search">Tìm kiếm</Label>
            <Input
              id="search"
              placeholder="Tên hoặc mã phòng..."
              value={query.search}
              onChange={(e) => setQuery({ ...query, search: e.target.value })}
            />
          </div>
          <div className="space-y-1 w-48">
            <Label htmlFor="status">Trạng thái</Label>
            <select
              id="status"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={query.status || ''}
              onChange={(e) => setQuery({ ...query, status: (e.target.value as any) || undefined })}
            >
              <option value="">Tất cả</option>
              <option value="AVAILABLE">Phòng trống</option>
              <option value="OCCUPIED">Đang cho thuê</option>
              <option value="MAINTENANCE">Bảo trì</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>
          <Button type="submit">Lọc</Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort('code')}>
                  Mã phòng {query.sortBy === 'code' && (query.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort('name')}>
                  Tên phòng {query.sortBy === 'name' && (query.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort('floor')}>
                  Tầng {query.sortBy === 'floor' && (query.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium cursor-pointer" onClick={() => handleSort('rentPrice')}>
                  Giá thuê {query.sortBy === 'rentPrice' && (query.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium">Trạng thái</th>
                <th className="p-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center">Đang tải...</td>
                </tr>
              ) : data?.data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-muted-foreground">Không có dữ liệu</td>
                </tr>
              ) : (
                data?.data?.items.map((room) => (
                  <tr key={room.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">{room.code}</td>
                    <td className="p-3 font-medium">{room.name}</td>
                    <td className="p-3">{room.floor || '-'}</td>
                    <td className="p-3">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.rentPrice)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        room.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800' :
                        room.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {room.status === 'AVAILABLE' ? 'Phòng trống' :
                         room.status === 'OCCUPIED' ? 'Đang cho thuê' :
                         room.status === 'MAINTENANCE' ? 'Bảo trì' :
                         room.status === 'INACTIVE' ? 'Ngừng hoạt động' : room.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/rooms/${room.id}`}>Chi tiết</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/rooms/${room.id}/edit`}>Sửa</Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(room.id)}>
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.data.meta.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4">
            <span className="text-sm text-muted-foreground">
              Hiển thị {data.data.items.length} trên tổng {data.data.meta.totalItems} kết quả
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={query.page === 1}
                onClick={() => setQuery((prev) => ({ ...prev, page: prev.page! - 1 }))}
              >
                Trước
              </Button>
              <div className="flex items-center px-4 text-sm font-medium">
                Trang {data.data.meta.currentPage} / {data.data.meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={query.page === data.data.meta.totalPages}
                onClick={() => setQuery((prev) => ({ ...prev, page: prev.page! + 1 }))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa phòng này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa phòng khỏi danh sách. Bạn chỉ có thể xóa phòng chưa có hợp đồng hoặc người thuê.
              {deleteError && (
                <div className="mt-2 text-red-500 font-medium">
                  {deleteError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa phòng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
