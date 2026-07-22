"use client";

import { useEffect, useState, useCallback } from "react";
import { tenantsApi } from "@/services/api/tenant";
import { Tenant, TenantQuery } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import Link from "next/link";
import { formatGender } from "@/lib/utils";
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  CreditCard,
  Pencil,
  Trash2,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<TenantQuery>({ page: 1, limit: 10 });
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenants = useCallback(async (currentQuery: TenantQuery) => {
    try {
      if (tenants.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const response = await tenantsApi.getAll(currentQuery);
      const items = (response.data as any).items || [];
      setTenants(items);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách người thuê");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [tenants.length]);

  useEffect(() => {
    fetchTenants(query);
  }, [query]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery({ ...query, search: e.target.value, page: 1 });
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);
    try {
      await tenantsApi.remove(tenantToDelete);
      setTenantToDelete(null);
      fetchTenants(query);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể xóa người thuê");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalTenantsCount = tenants.length;
  const tenantsWithPhoneCount = tenants.filter((t) => !!t.phone).length;
  const tenantsWithIdentityCount = tenants.filter((t) => !!t.identityNumber).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Danh sách Khách thuê
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Quản lý cư dân
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Quản lý thông tin định danh, liên hệ và hồ sơ cư dân thuê trọ
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="self-start sm:self-auto rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-11 px-5 gap-2 shadow-xs"
        >
          <Link href="/dashboard/tenants/new">
            <PlusCircle className="h-5 w-5" />
            Thêm Khách thuê mới
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Grid: 3 Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Tổng số Khách thuê */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số Khách thuê
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {loading && tenants.length === 0 ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {totalTenantsCount}
                  </span>
                  <span className="text-base font-semibold text-slate-500">cư dân</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Hồ sơ người thuê hiển thị</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Có số điện thoại */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đã cập nhật SĐT
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {loading && tenants.length === 0 ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {tenantsWithPhoneCount}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                    Có liên hệ
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Sẵn sàng nhận thông báo</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Đã cập nhật CCCD */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đã xác minh CCCD
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {loading && tenants.length === 0 ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {tenantsWithIdentityCount}
                  </span>
                  <span className="text-base font-semibold text-slate-500">định danh</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Đủ điều kiện làm hợp đồng</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Data Card: Toolbar + Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        {/* Filter Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên, CCCD, SĐT..."
              value={query.search || ""}
              onChange={handleSearch}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-slate-400"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table View with Locked Column Widths */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left table-fixed min-w-[760px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                <th className="w-[25%] pb-4 pr-4 whitespace-nowrap">Họ tên khách thuê</th>
                <th className="w-[18%] pb-4 px-3 whitespace-nowrap">Số CCCD / CMND</th>
                <th className="w-[16%] pb-4 px-3 whitespace-nowrap">Số điện thoại</th>
                <th className="w-[20%] pb-4 px-3 whitespace-nowrap">Email liên hệ</th>
                <th className="w-[10%] pb-4 px-3 whitespace-nowrap">Giới tính</th>
                <th className="w-[11%] pb-4 pl-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 transition-opacity duration-200 ${
                isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 pr-4"><Skeleton className="h-6 w-3/4 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-12 rounded-lg" /></td>
                    <td className="py-4 pl-3 text-right"><Skeleton className="h-6 w-24 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-800 text-base">Không tìm thấy khách thuê</p>
                      <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/dashboard/tenants/${tenant.id}`}
                        className="font-bold text-slate-900 group-hover:text-black transition-colors text-base block truncate hover:underline"
                      >
                        {tenant.fullName}
                      </Link>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-semibold text-slate-800 text-sm whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                        {tenant.identityNumber}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {tenant.phone || "-"}
                    </td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-600 truncate max-w-[200px]">
                      {tenant.email || "-"}
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs whitespace-nowrap">
                        {formatGender(tenant.gender)}
                      </span>
                    </td>
                    <td className="py-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
                        >
                          <Link href={`/dashboard/tenants/${tenant.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Xem
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
                        >
                          <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTenantToDelete(tenant.id)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
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
      <AlertDialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Xóa Khách thuê
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2">
              Bạn có chắc chắn muốn xóa Khách thuê này không? Hồ sơ cư dân sẽ không còn hiển thị trên hệ thống. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setTenantToDelete(null)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
