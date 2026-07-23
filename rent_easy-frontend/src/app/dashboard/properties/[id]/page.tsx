"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { propertiesApi } from "@/services/api/properties";
import { roomsApi } from "@/services/api/rooms";
import { PropertyDetail } from "@/types/property";
import { Room, RoomStatus } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPropertyType } from "@/lib/utils";
import {
  Building2,
  ArrowLeft,
  Pencil,
  DoorOpen,
  CheckCircle2,
  MapPin,
  Home,
  PlusCircle,
  Eye,
  Layers,
} from "lucide-react";

/* Room Status Badge Component */
function RoomStatusBadge({ status }: { status: RoomStatus }) {
  if (status === "AVAILABLE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 font-semibold text-xs whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Phòng trống
      </span>
    );
  }
  if (status === "OCCUPIED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/80 font-semibold text-xs whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        Đang cho thuê
      </span>
    );
  }
  if (status === "MAINTENANCE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 font-semibold text-xs whitespace-nowrap">
        Bảo trì
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs whitespace-nowrap">
      Ngừng hoạt động
    </span>
  );
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      try {
        const res = await propertiesApi.getById(propertyId);
        setProperty(res.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          notFound();
        } else {
          console.error("Failed to load property details:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await roomsApi.getAllByProperty(propertyId, { limit: 100 });
        setRooms(res.data?.items || []);
      } catch (error) {
        console.error("Failed to fetch property rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchProperty();
    fetchRooms();
  }, [propertyId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const { statistics } = property;

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
                {property.name}
              </h1>
              {property.status === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Đang hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Ngừng hoạt động
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              {property.address}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            asChild
            className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-sm h-10 px-4 gap-2 shadow-2xs"
          >
            <Link href={`/dashboard/properties/${property.id}/rooms`}>
              <DoorOpen className="h-4 w-4" />
              Quản lý Phòng ({statistics?.totalRooms || 0})
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm h-10 px-4 gap-2"
          >
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Basic Info Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Building2 className="h-6 w-6 text-slate-900 dark:text-slate-100" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Thông tin chi tiết Bất động sản
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Loại hình bất động sản
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {formatPropertyType(property.propertyType)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Trạng thái khai thác
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {property.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Địa chỉ đầy đủ
            </span>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {property.address}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mô tả thêm / Ghi chú
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {property.description || "Chưa có ghi chú chi tiết cho bất động sản này."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span>Ngày tạo: {new Date(property.createdAt).toLocaleDateString("vi-VN")}</span>
            <span>Cập nhật lần cuối: {new Date(property.updatedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>

        {/* Right Column: Room Stats Widget Card & Direct Navigation */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Home className="h-5 w-5 text-slate-900 dark:text-slate-100" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thống kê phòng trọ</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng số phòng
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {statistics?.totalRooms || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                <DoorOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Đã cho thuê
                </span>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {statistics?.occupiedRooms || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phòng còn trống
                </span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {statistics?.availableRooms || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <Home className="h-5 w-5" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Embedded Rooms List Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Danh sách Phòng trọ thuộc Bất động sản này
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Toàn bộ các phòng trọ hiện có trong tòa nhà {property.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs h-9 px-3.5 gap-1.5"
            >
              <Link href={`/dashboard/properties/${property.id}/rooms/new`}>
                <PlusCircle className="h-4 w-4" />
                Tạo phòng mới
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs h-9 px-3.5"
            >
              <Link href={`/dashboard/properties/${property.id}/rooms`}>
                Xem trang quản lý
              </Link>
            </Button>
          </div>
        </div>

        {/* Rooms Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[850px]">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 font-bold text-xs uppercase tracking-wider">
                <th className="w-[16%] pb-3 pr-3">Mã phòng</th>
                <th className="w-[20%] pb-3 px-2">Tên phòng</th>
                <th className="w-[12%] pb-3 px-2">Tầng</th>
                <th className="w-[16%] pb-3 px-2">Giá thuê</th>
                <th className="w-[18%] pb-3 px-2">Trạng thái</th>
                <th className="w-[18%] pb-3 pl-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingRooms ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 pr-3"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                    <td className="py-3.5 px-2"><Skeleton className="h-5 w-28 rounded-lg" /></td>
                    <td className="py-3.5 px-2"><Skeleton className="h-5 w-12 rounded-lg" /></td>
                    <td className="py-3.5 px-2"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                    <td className="py-3.5 px-2"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                    <td className="py-3.5 pl-2 text-right"><Skeleton className="h-5 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <DoorOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Chưa có phòng trọ nào
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Nhấn nút "+ Tạo phòng mới" để thêm phòng đầu tiên cho bất động sản này.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 pr-3 font-bold text-slate-900 dark:text-white text-sm">
                      <Link href={`/dashboard/rooms/${room.id}`} className="hover:underline">
                        {room.code}
                      </Link>
                    </td>
                    <td className="py-3.5 px-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {room.name}
                    </td>
                    <td className="py-3.5 px-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {room.floor != null ? `Tầng ${room.floor}` : "---"}
                    </td>
                    <td className="py-3.5 px-2 text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(room.rentPrice)}
                    </td>
                    <td className="py-3.5 px-2">
                      <RoomStatusBadge status={room.status} />
                    </td>
                    <td className="py-3.5 pl-2 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
