"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { propertiesApi } from "@/services/api/properties";
import { PropertyDetail } from "@/types/property";
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
  FileText,
  Home,
} from "lucide-react";

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

    fetchProperty();
  }, [propertyId]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl border-slate-300 text-slate-800 font-bold hover:bg-slate-100 h-10 px-3.5 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {property.name}
              </h1>
              {property.status === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Đang hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Ngừng hoạt động
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              {property.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            asChild
            className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-10 px-4 gap-2 shadow-xs"
          >
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Main Content Grid (Details on Left 2-Cols, Stats on Right 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Basic Info Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Building2 className="h-6 w-6 text-slate-900" />
            <h2 className="text-xl font-bold text-slate-900">Thông tin chi tiết Bất động sản</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Loại hình bất động sản
              </span>
              <p className="text-base font-bold text-slate-900">
                {formatPropertyType(property.propertyType)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Trạng thái khai thác
              </span>
              <p className="text-base font-bold text-slate-900">
                {property.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Địa chỉ đầy đủ
            </span>
            <p className="text-base font-semibold text-slate-900 leading-relaxed">
              {property.address}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mô tả thêm / Ghi chú
            </span>
            <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
              {property.description || "Chưa có ghi chú chi tiết cho bất động sản này."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-100">
            <span>Ngày tạo: {new Date(property.createdAt).toLocaleDateString("vi-VN")}</span>
            <span>Cập nhật lần cuối: {new Date(property.updatedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>

        {/* Right Column: Room Stats Widget Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Home className="h-5 w-5 text-slate-900" />
            <h2 className="text-lg font-bold text-slate-900">Thống kê phòng trọ</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tổng số phòng
                </span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {statistics?.totalRooms || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-200/60 text-slate-800">
                <DoorOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Đã cho thuê
                </span>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">
                  {statistics?.occupiedRooms || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phòng còn trống
                </span>
                <p className="text-2xl font-black text-slate-800 mt-0.5">
                  {statistics?.availableRooms || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-200/60 text-slate-700">
                <Home className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
