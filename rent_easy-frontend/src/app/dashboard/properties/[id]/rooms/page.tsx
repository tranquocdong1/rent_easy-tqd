"use client";

import { useEffect, useState, useCallback, use } from "react";
import { propertiesApi } from "@/services/api/properties";
import { roomsApi } from "@/services/api/rooms";
import { PropertyDetail } from "@/types/property";
import { Room, RoomQuery, RoomStatus } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  DoorOpen,
  ArrowLeft,
  PlusCircle,
  Search,
  CheckCircle2,
  Home,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  Check,
  AlertCircle,
  Building2,
} from "lucide-react";
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

/* Custom Sleek Dropdown Select Component for Room Status */
function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "Tất cả trạng thái", value: "" },
    { label: "Phòng trống", value: "AVAILABLE" },
    { label: "Đang cho thuê", value: "OCCUPIED" },
    { label: "Bảo trì", value: "MAINTENANCE" },
    { label: "Ngừng hoạt động", value: "INACTIVE" },
  ];

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 w-full sm:w-[200px] flex items-center justify-between gap-2 px-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-full sm:w-[220px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 py-1.5 space-y-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
                  value === opt.value
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="h-4 w-4 text-slate-900 dark:text-white" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function RoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<RoomQuery>({
    page: 1,
    limit: 100,
    search: "",
    status: undefined,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const [resRooms, resProp] = await Promise.all([
        roomsApi.getAllByProperty(propertyId, query),
        propertiesApi.getById(propertyId).catch(() => null),
      ]);
      setRooms(resRooms.data?.items || []);
      if (resProp) setProperty(resProp.data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, query]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await roomsApi.remove(deleteId);
      setDeleteId(null);
      fetchRooms();
    } catch (error: any) {
      if (error.response?.data?.code === "ROOM_IN_USE") {
        setDeleteError("Phòng đang được sử dụng trong hợp đồng, không thể xóa.");
      } else {
        setDeleteError("Đã có lỗi xảy ra khi xóa phòng.");
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

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      !query.search ||
      room.code.toLowerCase().includes(query.search.toLowerCase()) ||
      room.name.toLowerCase().includes(query.search.toLowerCase());
    const matchesStatus = !query.status || room.status === query.status;
    return matchesSearch && matchesStatus;
  });

  const totalRoomsCount = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === "OCCUPIED").length;
  const availableCount = rooms.filter((r) => r.status === "AVAILABLE").length;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 h-10 px-3.5 gap-1.5"
          >
            <Link href={`/dashboard/properties/${propertyId}`}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Quản lý Phòng trọ
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Building2 className="h-3.5 w-3.5" />
                {property?.name || "Bất động sản"}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Danh sách và thông số vận hành các phòng trọ thuộc tòa nhà
            </p>
          </div>
        </div>

        <Button
          asChild
          className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-sm h-10 px-4 gap-2 shadow-2xs self-start sm:self-auto"
        >
          <Link href={`/dashboard/properties/${propertyId}/rooms/new`}>
            <PlusCircle className="h-4 w-4" />
            + Tạo Phòng mới
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Cards with Locked Heights */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng số Phòng
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <DoorOpen className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-20 my-1" />
          ) : (
            <div className="min-h-[64px] flex flex-col justify-end">
              <span className="text-4xl font-black text-slate-900 dark:text-white">
                {totalRoomsCount} <span className="text-sm font-semibold text-slate-500">phòng</span>
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã cho thuê
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-20 my-1" />
          ) : (
            <div className="min-h-[64px] flex flex-col justify-end">
              <span className="text-4xl font-black text-sky-700 dark:text-sky-400">
                {occupiedCount} <span className="text-sm font-semibold text-slate-500">phòng</span>
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Phòng còn trống
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Home className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-20 my-1" />
          ) : (
            <div className="min-h-[64px] flex flex-col justify-end">
              <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
                {availableCount} <span className="text-sm font-semibold text-slate-500">phòng</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Toolbar: Instant Search & Status Filter */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Tìm theo mã hoặc tên phòng..."
            value={query.search}
            onChange={(e) => setQuery((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-slate-400"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <StatusSelect
            value={query.status || ""}
            onChange={(val) => setQuery((prev) => ({ ...prev, status: (val as RoomStatus) || undefined }))}
          />
        </div>
      </div>

      {/* 4. Main Rooms Table with fixed layout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="w-[15%] py-4 px-4">Mã phòng</th>
                <th className="w-[18%] py-4 px-3">Tên phòng</th>
                <th className="w-[10%] py-4 px-3">Tầng</th>
                <th className="w-[17%] py-4 px-3 text-right">Giá thuê</th>
                <th className="w-[18%] py-4 px-3">Trạng thái</th>
                <th className="w-[22%] py-4 pr-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-5 w-28 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-5 w-12 rounded-lg" /></td>
                    <td className="py-4 px-3 text-right"><Skeleton className="h-5 w-24 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                    <td className="py-4 pr-4 text-right"><Skeleton className="h-5 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <DoorOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                        Không tìm thấy phòng trọ nào
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white text-sm">
                      <Link href={`/dashboard/rooms/${room.id}`} className="hover:underline">
                        {room.code}
                      </Link>
                    </td>
                    <td className="py-4 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {room.name}
                    </td>
                    <td className="py-4 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {room.floor != null ? `Tầng ${room.floor}` : "---"}
                    </td>
                    <td className="py-4 px-3 text-right text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(room.rentPrice)}
                    </td>
                    <td className="py-4 px-3">
                      <RoomStatusBadge status={room.status} />
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900"
                        >
                          <Link href={`/dashboard/rooms/${room.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Xem
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900"
                        >
                          <Link href={`/dashboard/rooms/${room.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(room.id)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
              onClick={() => setDeleteId(null)}
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
