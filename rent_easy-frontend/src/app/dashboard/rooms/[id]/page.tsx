"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roomsApi } from "@/services/api/rooms";
import { Room, RoomStatus, RoomStatistics } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DoorOpen,
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Users,
  Receipt,
  AlertCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* Room Status Badge Component */
function RoomStatusBadge({ status }: { status: RoomStatus }) {
  if (status === "AVAILABLE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Phòng trống
      </span>
    );
  }
  if (status === "OCCUPIED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/80">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        Đang cho thuê
      </span>
    );
  }
  if (status === "MAINTENANCE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80">
        Bảo trì
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      Ngừng hoạt động
    </span>
  );
}

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoadingRoom(true);
        const res = await roomsApi.getById(roomId);
        setRoom(res.data);
      } catch (err) {
        setError("Không thể tải thông tin phòng.");
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
        // Fail silently for stats
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [roomId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await roomsApi.remove(roomId);
      toast.success("Xóa phòng thành công");
      setDeleteOpen(false);
      if (room?.propertyId) {
        router.push(`/dashboard/properties/${room.propertyId}/rooms`);
      } else {
        router.back();
      }
    } catch (err: any) {
      if (err.response?.data?.code === "ROOM_IN_USE") {
        setDeleteError("Phòng đang được sử dụng trong hợp đồng, không thể xóa.");
      } else {
        setDeleteError(err.response?.data?.message || "Đã có lỗi xảy ra khi xóa phòng.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loadingRoom) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200/90 dark:border-slate-800 shadow-2xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Không tìm thấy phòng</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Phòng trọ này không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button
          onClick={() => router.back()}
          className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-sm px-6 h-10"
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 h-10 px-3.5 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Phòng {room.code}: {room.name}
              </h1>
              <RoomStatusBadge status={room.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Tầng {room.floor || "---"} | Diện tích: {room.area} m² | Sức chứa: {room.capacity} người
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            asChild
            className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-sm h-10 px-4 gap-2 shadow-2xs"
          >
            <Link href={`/dashboard/rooms/${room.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="rounded-xl border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-sm h-10 px-3.5 gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hợp đồng đang hiệu lực
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          {loadingStats ? (
            <Skeleton className="h-8 w-16 my-1" />
          ) : (
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.activeContracts || 0}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Khách thuê hiện tại
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          {loadingStats ? (
            <Skeleton className="h-8 w-16 my-1" />
          ) : (
            <div>
              <span className="text-3xl font-black text-sky-700 dark:text-sky-400">
                {stats?.currentTenants || 0} <span className="text-sm font-semibold text-slate-500">người</span>
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hóa đơn chưa thanh toán
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          {loadingStats ? (
            <Skeleton className="h-8 w-16 my-1" />
          ) : (
            <div>
              <span className="text-3xl font-black text-amber-700 dark:text-amber-400">
                {stats?.unpaidInvoices || 0} <span className="text-sm font-semibold text-slate-500">hóa đơn</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Detail Specifications Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <DoorOpen className="h-6 w-6 text-slate-900 dark:text-slate-100" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Thông số kỹ thuật & Cấu hình phòng
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mã nhận diện phòng
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white">{room.code}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Vị trí Tầng
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {room.floor != null ? `Tầng ${room.floor}` : "Chưa xác định"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Diện tích căn phòng
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white">{room.area} m²</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sức chứa tối đa
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white">{room.capacity} người</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Giá thuê hàng tháng
            </span>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(room.rentPrice)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tiền cọc quy định
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {formatCurrency(room.deposit)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mô tả thêm / Ghi chú nội thất
          </span>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {room.description || "Chưa có ghi chú thông tin bổ sung cho phòng này."}
          </p>
        </div>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Xóa phòng trọ này?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Hành động này sẽ xóa phòng khỏi hệ thống. Bạn chỉ có thể xóa phòng chưa có hợp đồng hoặc người thuê active.
              {deleteError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold">
                  {deleteError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting ? "Đang xóa..." : "Xóa phòng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
