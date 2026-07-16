'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roomsApi } from '@/services/api/rooms';
import { Room, RoomStatistics } from '@/types/room';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [stats, setStats] = useState<RoomStatistics | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoadingRoom(true);
        const res = await roomsApi.getById(roomId);
        setRoom(res.data);
      } catch (err) {
        setError('Không thể tải thông tin phòng.');
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const res = await roomsApi.getStatistics(roomId);
        setStats(res.data);
      } catch (err) {
        // Just fail silently for stats or show warning
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [roomId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await roomsApi.remove(deleteId);
      setDeleteId(null);
      if (room?.propertyId) { // Fallback if propertyId is available in DTO
        router.push(`/dashboard/properties/${room.propertyId}/rooms`);
      } else {
        router.back();
      }
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

  if (loadingRoom) return <div className="p-8 text-center">Đang tải...</div>;
  if (error || !room) return <div className="p-8 text-center text-red-500">{error || 'Không tìm thấy phòng'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chi tiết phòng: {room.code} - {room.name}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>

      {/* 1. THÔNG TIN ROOM */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
          <CardDescription>Chi tiết cấu hình và giá cả của phòng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Trạng thái</p>
              <p className="mt-1 font-semibold">
                <span className={`px-2 py-1 rounded-full text-xs ${
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
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tầng</p>
              <p className="mt-1 font-semibold">{room.floor || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Diện tích</p>
              <p className="mt-1 font-semibold">{room.area} m²</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sức chứa</p>
              <p className="mt-1 font-semibold">{room.capacity} người</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Giá thuê</p>
              <p className="mt-1 font-semibold text-blue-600">{room.rentPrice.toLocaleString()} ₫</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Giá cọc</p>
              <p className="mt-1 font-semibold text-blue-600">{room.deposit.toLocaleString()} ₫</p>
            </div>
          </div>
          {room.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500">Mô tả</p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{room.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. STATISTICS */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê hiện tại</CardTitle>
          <CardDescription>Số liệu vận hành của phòng</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <p className="text-sm text-gray-500">Đang tải số liệu...</p>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Hợp đồng đang hiệu lực</p>
                <p className="text-2xl font-bold mt-1 text-slate-800">{stats.activeContracts}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Người thuê hiện tại</p>
                <p className="text-2xl font-bold mt-1 text-slate-800">{stats.currentTenants}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Hoá đơn chưa thanh toán</p>
                <p className="text-2xl font-bold mt-1 text-slate-800">{stats.unpaidInvoices}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500">Không thể hiển thị thống kê</p>
          )}
        </CardContent>
      </Card>

      {/* 3. ACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Hành động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <Link href={`/dashboard/rooms/${room.id}/edit`}>Sửa thông tin</Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteId(room.id)}>
              Xóa phòng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa phòng này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa phòng khỏi hệ thống.
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
