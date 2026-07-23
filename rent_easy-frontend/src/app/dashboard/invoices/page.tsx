"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getInvoices, deleteInvoice } from "@/services/api/invoices";
import { InvoiceQuery, InvoiceStatus, InvoiceListItem } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Eye,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";

/* Custom Popover Dropdown Select Component for Status */
function StatusSelect({
  value,
  onChange,
}: {
  value?: InvoiceStatus | "ALL";
  onChange: (val: InvoiceStatus | "ALL") => void;
}) {
  const [open, setOpen] = useState(false);

  const options: { label: string; value: InvoiceStatus | "ALL" }[] = [
    { label: "Tất cả trạng thái", value: "ALL" },
    { label: "Đã thanh toán", value: InvoiceStatus.PAID },
    { label: "Chưa thanh toán", value: InvoiceStatus.UNPAID },
    { label: "Thanh toán 1 phần", value: InvoiceStatus.PARTIALLY_PAID },
    { label: "Quá hạn", value: InvoiceStatus.OVERDUE },
    { label: "Nháp", value: InvoiceStatus.DRAFT },
    { label: "Đã hủy", value: InvoiceStatus.CANCELLED },
  ];

  const selectedOption = options.find((o) => o.value === (value || "ALL")) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none transition-colors"
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
          <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  (value || "ALL") === option.value
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                <span>{option.label}</span>
                {(value || "ALL") === option.value && (
                  <Check className="h-4 w-4 text-slate-900" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Custom Popover Dropdown Select Component for Month */
function MonthSelect({
  value,
  onChange,
}: {
  value?: number;
  onChange: (val?: number) => void;
}) {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "Tất cả tháng", value: undefined },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `Tháng ${i + 1}`,
      value: i + 1,
    })),
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none transition-colors"
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
          <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {options.map((option, idx) => (
              <button
                key={idx}
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

/* Status Badge Component */
function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-xs whitespace-nowrap">
        Đã thanh toán
      </span>
    );
  }
  if (status === "UNPAID") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold text-xs whitespace-nowrap">
        Chưa thanh toán
      </span>
    );
  }
  if (status === "PARTIALLY_PAID") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200/80 font-semibold text-xs whitespace-nowrap">
        Thanh toán 1 phần
      </span>
    );
  }
  if (status === "OVERDUE" || status === "CANCELLED") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200/80 font-semibold text-xs whitespace-nowrap">
        {status === "OVERDUE" ? "Quá hạn" : "Đã hủy"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs whitespace-nowrap">
      Nháp
    </span>
  );
}

function InvoicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  const [query, setQuery] = useState<InvoiceQuery>({
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as InvoiceStatus) || undefined,
    month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
    year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
  });

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.page && query.page > 1) params.set("page", query.page.toString());
    if (query.limit && query.limit !== 10) params.set("limit", query.limit.toString());
    if (query.sortBy && query.sortBy !== "createdAt") params.set("sortBy", query.sortBy);
    if (query.sortOrder && query.sortOrder !== "desc") params.set("sortOrder", query.sortOrder);
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    if (query.month) params.set("month", query.month.toString());
    if (query.year) params.set("year", query.year.toString());

    router.replace(`${pathname}?${params.toString()}`);
  }, [query, pathname, router]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["invoices", query],
    queryFn: () => getInvoices(query),
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: (_, deletedId) => {
      toast.success("Xóa hóa đơn thành công!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", deletedId] });
      setDeleteDialogId(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi xóa hóa đơn";
      toast.error(msg);
      setDeleteDialogId(null);
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (data?.data?.meta && newPage >= 1 && newPage <= data.data.meta.totalPages) {
      setQuery((prev) => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const items: InvoiceListItem[] = data?.data?.items || [];
  const meta = data?.data?.meta;

  const paidCount = items.filter((i) => i.status === "PAID").length;
  const unpaidOrOverdueCount = items.filter(
    (i) => i.status === "UNPAID" || i.status === "OVERDUE" || i.status === "PARTIALLY_PAID"
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Quản lý Hóa đơn
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Thu tiền hàng tháng
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Theo dõi hóa đơn thanh toán, thu tiền phòng và các phí dịch vụ hàng tháng
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="self-start sm:self-auto rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-11 px-5 gap-2 shadow-xs"
        >
          <Link href="/dashboard/invoices/new">
            <PlusCircle className="h-5 w-5" />
            Tạo Hóa đơn mới
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Grid: 3 Stat Cards with Fixed Height */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Tổng số Hóa đơn */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số Hóa đơn
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {isLoading && !data ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {meta?.totalItems ?? items.length}
                  </span>
                  <span className="text-base font-semibold text-slate-500">hóa đơn</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Tổng số trong danh sách</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Đã thanh toán */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đã thanh toán
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {isLoading && !data ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">{paidCount}</span>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                    Đã thu tiền
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Hoàn tất thanh toán</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Chưa thu / Quá hạn */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chưa thu / Quá hạn
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {isLoading && !data ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {unpaidOrOverdueCount}
                  </span>
                  <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                    Cần xử lý
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Cần đôn đốc thanh toán</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Data Card: Toolbar + Table + Pagination */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo mã HĐ, khách thuê, phòng..."
              value={query.search || ""}
              onChange={handleSearchChange}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MonthSelect
              value={query.month}
              onChange={(val) => setQuery((prev) => ({ ...prev, month: val, page: 1 }))}
            />

            <StatusSelect
              value={query.status || "ALL"}
              onChange={(val) =>
                setQuery((prev) => ({
                  ...prev,
                  status: val === "ALL" ? undefined : val,
                  page: 1,
                }))
              }
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left table-fixed min-w-[1050px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                <th className="w-[13%] pb-4 pr-4 whitespace-nowrap">Mã Hóa đơn</th>
                <th className="w-[14%] pb-4 px-3 whitespace-nowrap">Khách thuê</th>
                <th className="w-[18%] pb-4 px-3 whitespace-nowrap">Phòng / Khu trọ</th>
                <th className="w-[11%] pb-4 px-3 whitespace-nowrap">Hạn thanh toán</th>
                <th className="w-[13%] pb-4 px-3 text-right whitespace-nowrap">Tổng tiền</th>
                <th className="w-[13%] pb-4 px-3 whitespace-nowrap">Trạng thái</th>
                <th className="w-[18%] pb-4 pl-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 transition-opacity duration-200 ${
                isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {isLoading && !data ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 pr-4"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-28 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3 text-right"><Skeleton className="h-6 w-20 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="py-4 pl-3 text-right"><Skeleton className="h-6 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-red-600">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="h-10 w-10 text-red-400" />
                      <p className="font-bold text-base">Đã có lỗi xảy ra khi tải danh sách hóa đơn</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Receipt className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-800 text-base">Không tìm thấy hóa đơn</p>
                      <p className="text-xs text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-bold text-slate-900 group-hover:text-black transition-colors text-base block truncate hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-3 font-semibold text-slate-800 text-sm truncate">
                      {invoice.tenantName}
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        Phòng {invoice.roomCode}
                        <span className="text-slate-500 font-normal text-xs ml-1.5">
                          ({invoice.propertyName})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-4 px-3 text-right font-extrabold text-slate-900 text-sm whitespace-nowrap">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="py-4 px-3">
                      <InvoiceBadge status={invoice.status} />
                    </td>
                    <td className="py-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
                        >
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
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
                          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </Link>
                        </Button>
                        {invoice.status === "UNPAID" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteDialogId(invoice.id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Xóa
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-slate-600">
            <div>
              Trang {meta.currentPage} / {meta.totalPages} (Tổng số {meta.totalItems} hóa đơn)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(meta.currentPage - 1)}
                disabled={meta.currentPage === 1 || isLoading}
                className="rounded-xl border-slate-300 text-slate-900 font-bold h-9 px-3 text-xs gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(meta.currentPage + 1)}
                disabled={meta.currentPage === meta.totalPages || isLoading}
                className="rounded-xl border-slate-300 text-slate-900 font-bold h-9 px-3 text-xs gap-1"
              >
                Tiếp
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Xác nhận xóa Hóa đơn
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2">
              Bạn có chắc chắn muốn xóa hóa đơn này? Hóa đơn sẽ được xóa mềm và không còn xuất hiện trong danh sách.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteDialogId(null)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteDialogId && deleteMutation.mutate(deleteDialogId);
              }}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Đang tải...</div>}>
      <InvoicesPageContent />
    </Suspense>
  );
}
