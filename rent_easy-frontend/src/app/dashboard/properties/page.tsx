"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { propertiesApi } from "@/services/api/properties";
import { Property, PropertyQuery, PaginatedResponse } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatPropertyType } from "@/lib/utils";
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  DoorOpen,
  ArrowUpDown,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
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

/* Custom Sleek Dropdown Select Component */
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
    { label: "Đang hoạt động", value: "ACTIVE" },
    { label: "Ngừng hoạt động", value: "INACTIVE" },
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-none transition-colors"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  value === option.value
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 text-slate-900" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PropertiesPageContent() {
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState<PropertyQuery>({
    page: 1,
    limit: 10,
    sortBy: "updatedAt",
    sortOrder: "desc",
    search: "",
    status: undefined,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      if (!data) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const res = await propertiesApi.getAll(query);
      setData(res);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
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
      setDeleteError(errRes?.message || "Có lỗi xảy ra khi xóa Bất động sản");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalProperties = data?.data?.meta?.totalItems ?? 0;
  const items = data?.data?.items ?? [];
  const activeCount = items.filter((p) => p.status === "ACTIVE").length;
  const totalRoomsCount = items.reduce((acc, p) => acc + (p.roomCount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Danh sách Bất động sản
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Quản lý nhà trọ
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Quản lý thông tin các tòa nhà trọ, danh sách phòng và thông tin vận hành
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="self-start sm:self-auto rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-11 px-5 gap-2 shadow-xs"
        >
          <Link href="/dashboard/properties/new">
            <PlusCircle className="h-5 w-5" />
            Thêm Nhà trọ mới
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Grid: 3 Stat Cards with Stable Height */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Tổng số Nhà trọ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số Bất động sản
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-24 my-1" />
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-black text-slate-900">
                  {totalProperties}
                </span>
                <span className="text-base font-semibold text-slate-500">nhà trọ</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1.5">Tổng số trong hệ thống</p>
            </div>
          )}
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đang hoạt động
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-24 my-1" />
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-black text-slate-900">
                  {activeCount}
                </span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1.5">Đang khai thác kinh doanh</p>
            </div>
          )}
        </div>

        {/* Card 3: Số lượng phòng */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Số lượng phòng
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <DoorOpen className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-24 my-1" />
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-black text-slate-900">
                  {totalRoomsCount}
                </span>
                <span className="text-base font-semibold text-slate-500">tổng số phòng</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1.5">Tính trên danh sách hiển thị</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Data Card: Toolbar + Table + Pagination */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        {/* Filter Toolbar with Custom Dropdown Component */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên nhà trọ..."
              value={query.search || ""}
              onChange={handleSearchChange}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <StatusSelect
              value={query.status || ""}
              onChange={(val) =>
                setQuery((prev) => ({
                  ...prev,
                  status: (val as any) || undefined,
                  page: 1,
                }))
              }
            />
          </div>
        </div>

        {/* Properties Table View with Proper Column Widths & Whitespace Handling */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left table-fixed min-w-[760px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                <th
                  className="w-[28%] pb-4 pr-4 cursor-pointer hover:text-slate-900 transition-colors select-none whitespace-nowrap"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tên nhà trọ</span>
                    <ArrowUpDown className={`h-3.5 w-3.5 ${query.sortBy === 'name' ? 'text-slate-900 font-bold' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="w-[18%] pb-4 px-3 whitespace-nowrap">Loại hình</th>
                <th className="w-[15%] pb-4 px-3 whitespace-nowrap">Trạng thái</th>
                <th className="w-[11%] pb-4 px-3 text-center whitespace-nowrap">Số phòng</th>
                <th
                  className="w-[13%] pb-4 px-3 cursor-pointer hover:text-slate-900 transition-colors select-none whitespace-nowrap"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cập nhật lần cuối</span>
                    <ArrowUpDown className={`h-3.5 w-3.5 ${query.sortBy === 'updatedAt' ? 'text-slate-900 font-bold' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="w-[15%] pb-4 pl-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 pr-4"><Skeleton className="h-6 w-3/4 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="py-4 pl-3 text-right"><Skeleton className="h-6 w-28 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Building2 className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-800 text-base">Không tìm thấy dữ liệu nhà trọ</p>
                      <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="font-bold text-slate-900 group-hover:text-black transition-colors text-base block truncate hover:underline"
                      >
                        {property.name}
                      </Link>
                      <div className="text-slate-500 truncate max-w-[240px] text-sm font-normal mt-0.5">
                        {property.address}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200/60 whitespace-nowrap">
                        {formatPropertyType(property.propertyType)}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      {property.status === "ACTIVE" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-xs whitespace-nowrap">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold text-xs whitespace-nowrap">
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-md text-sm sm:text-base whitespace-nowrap">
                        {property.roomCount} phòng
                      </span>
                    </td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {new Date(property.updatedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
                        >
                          <Link href={`/dashboard/properties/${property.id}`}>
                            Chi tiết
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
                        >
                          <Link href={`/dashboard/properties/${property.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(property.id)}
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

        {/* Pagination Footer */}
        {data?.data?.meta && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-slate-600">
            <div>
              Hiển thị {(data.data.meta.currentPage - 1) * data.data.meta.itemsPerPage + 1} đến{" "}
              {Math.min(
                data.data.meta.currentPage * data.data.meta.itemsPerPage,
                data.data.meta.totalItems
              )}{" "}
              của {data.data.meta.totalItems} bất động sản
            </div>

            {data.data.meta.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.data.meta.currentPage - 1)}
                  disabled={data.data.meta.currentPage === 1}
                  className="rounded-xl border-slate-300 text-slate-900 font-bold h-9 px-3 text-xs gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>

                <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-900">
                  {data.data.meta.currentPage} / {data.data.meta.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.data.meta.currentPage + 1)}
                  disabled={data.data.meta.currentPage === data.data.meta.totalPages}
                  className="rounded-xl border-slate-300 text-slate-900 font-bold h-9 px-3 text-xs gap-1"
                >
                  Tiếp
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Xóa Bất động sản
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2">
              Bạn có chắc chắn muốn xóa Bất động sản này không? Tất cả các phòng trọ và dữ liệu liên quan sẽ bị ảnh hưởng. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
            {deleteError && (
              <p className="text-sm font-semibold text-red-600 mt-2 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {deleteError}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
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

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
      <PropertiesPageContent />
    </Suspense>
  );
}
