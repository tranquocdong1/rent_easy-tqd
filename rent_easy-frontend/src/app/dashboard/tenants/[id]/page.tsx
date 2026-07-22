"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { tenantsApi } from "@/services/api/tenant";
import { TenantDetail } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantContracts } from "./components/tenant-contracts";
import { TenantInvoices } from "./components/tenant-invoices";
import { formatGender } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  FileText,
  Receipt,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "contracts" | "payments">("info");

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const res = await tenantsApi.getById(tenantId);
        setTenant(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("TENANT_NOT_FOUND");
        } else {
          setError(err.response?.data?.message || "Không thể tải dữ liệu người thuê");
        }
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchTenant();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error === "TENANT_NOT_FOUND" || !tenant) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200/90 shadow-2xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy khách thuê</h2>
        <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
          Hồ sơ khách thuê này có thể đã bị xóa hoặc không tồn tại trên hệ thống.
        </p>
        <Button
          onClick={() => router.push("/dashboard/tenants")}
          className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 h-10"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const initials = tenant.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/tenants")}
            className="rounded-xl border-slate-300 text-slate-800 font-bold hover:bg-slate-100 h-10 px-3.5 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Chi tiết Hồ sơ Khách thuê
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Thông tin định danh, hợp đồng thuê và lịch sử thanh toán
            </p>
          </div>
        </div>

        <Button
          asChild
          className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-10 px-4 gap-2 shadow-xs self-start sm:self-auto"
        >
          <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Sửa thông tin
          </Link>
        </Button>
      </div>

      {/* 2. Hero Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
            {initials}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">{tenant.fullName}</h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md text-slate-900 border border-slate-200/60">
                <CreditCard className="h-4 w-4 text-slate-600" />
                CCCD: {tenant.identityNumber}
              </span>
              {tenant.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                  {tenant.phone}
                </span>
              )}
              {tenant.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                  {tenant.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary Widget */}
        <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
          <div
            className="flex-1 md:flex-none text-center cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors"
            onClick={() => setActiveTab("contracts")}
          >
            <div className="text-2xl font-black text-slate-900">
              {tenant.statistics?.activeContracts || 0}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Hợp đồng đang thuê</div>
          </div>
          <div
            className="flex-1 md:flex-none text-center cursor-pointer p-3 rounded-xl bg-red-50/70 border border-red-200/80 hover:border-red-300 transition-colors"
            onClick={() => setActiveTab("payments")}
          >
            <div className="text-2xl font-black text-red-700">
              {tenant.paymentStats?.unpaidInvoices || 0}
            </div>
            <div className="text-xs font-semibold text-red-800 mt-0.5">Hóa đơn chưa thu</div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "info"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("contracts")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "contracts"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <FileText className="h-4 w-4" />
          Hợp đồng & Phòng
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "payments"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Lịch sử thanh toán
        </button>
      </div>

      {/* 4. Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <ShieldCheck className="h-5.5 w-5.5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Chi tiết thông tin định danh</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Giới tính
                  </span>
                  <p className="text-base font-bold text-slate-900">
                    {formatGender(tenant.gender)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ngày sinh
                  </span>
                  <p className="text-base font-bold text-slate-900">
                    {tenant.dateOfBirth
                      ? new Date(tenant.dateOfBirth).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Số CCCD / CMND
                </span>
                <p className="text-lg font-extrabold text-slate-900">{tenant.identityNumber}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ngày cấp CCCD
                  </span>
                  <p className="text-base font-semibold text-slate-900">
                    {tenant.identityIssuedDate
                      ? new Date(tenant.identityIssuedDate).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nơi cấp CCCD
                  </span>
                  <p className="text-base font-semibold text-slate-900 truncate">
                    {tenant.identityIssuedPlace || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Extra Info Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Phone className="h-5.5 w-5.5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Thông tin liên hệ & Khác</h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Địa chỉ thường trú
                </span>
                <p className="text-base font-semibold text-slate-900 leading-relaxed">
                  {tenant.permanentAddress || "-"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Số điện thoại
                  </span>
                  <p className="text-base font-bold text-slate-900">{tenant.phone || "-"}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Địa chỉ Email
                  </span>
                  <p className="text-base font-semibold text-slate-900 truncate">
                    {tenant.email || "-"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ghi chú chi tiết
                </span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {tenant.note || "Không có ghi chú thêm."}
                </p>
              </div>

              <div className="pt-2 text-xs font-medium text-slate-500 border-t border-slate-100 flex items-center justify-between">
                <span>Hồ sơ tạo lúc: {new Date(tenant.createdAt).toLocaleDateString("vi-VN")}</span>
                <span>ID: {tenant.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contracts" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <TenantContracts tenantId={tenant.id} />
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <TenantInvoices tenantId={tenant.id} />
          </div>
        )}
      </div>
    </div>
  );
}
