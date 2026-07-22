"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getPayments } from "@/services/api/payments";
import { PaymentQuery, PaymentStatus, PaymentMethod, PaymentListItem } from "@/types/payment";
import { propertiesApi } from "@/services/api/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CreditCard,
  Building2,
  FileText,
} from "lucide-react";
import Link from "next/link";

/* Custom Popover Dropdown Select Component for Status */
function StatusSelect({
  value,
  onChange,
}: {
  value?: PaymentStatus | "ALL";
  onChange: (val: PaymentStatus | "ALL") => void;
}) {
  const [open, setOpen] = useState(false);

  const options: { label: string; value: PaymentStatus | "ALL" }[] = [
    { label: "Tất cả trạng thái", value: "ALL" },
    { label: "Đã thanh toán", value: "COMPLETED" },
    { label: "Đang xử lý", value: "PENDING" },
    { label: "Thất bại", value: "FAILED" },
    { label: "Đã hủy", value: "CANCELLED" },
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
          <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5">
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

/* Custom Popover Dropdown Select Component for Payment Method */
function MethodSelect({
  value,
  onChange,
}: {
  value?: PaymentMethod | "ALL";
  onChange: (val: PaymentMethod | "ALL") => void;
}) {
  const [open, setOpen] = useState(false);

  const options: { label: string; value: PaymentMethod | "ALL" }[] = [
    { label: "Tất cả PTTT", value: "ALL" },
    { label: "Tiền mặt", value: "CASH" },
    { label: "Chuyển khoản", value: "BANK_TRANSFER" },
    { label: "Thẻ tín dụng", value: "CREDIT_CARD" },
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
          <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5">
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

/* Status Badge Component */
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-xs whitespace-nowrap">
        Đã thanh toán
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold text-xs whitespace-nowrap">
        Đang xử lý
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200/80 font-semibold text-xs whitespace-nowrap">
      {status === "FAILED" ? "Thất bại" : "Đã hủy"}
    </span>
  );
}

/* Method Badge Component */
function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const methodMap: Record<PaymentMethod, string> = {
    CASH: "Tiền mặt",
    BANK_TRANSFER: "Chuyển khoản",
    CREDIT_CARD: "Thẻ tín dụng",
  };
  return (
    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 whitespace-nowrap">
      {methodMap[method] || method}
    </span>
  );
}

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [query, setQuery] = useState<PaymentQuery>({
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    sortBy: (searchParams.get("sortBy") as any) || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as PaymentStatus) || undefined,
    paymentMethod: (searchParams.get("paymentMethod") as PaymentMethod) || undefined,
    propertyId: searchParams.get("propertyId") || undefined,
    billingMonth: searchParams.get("billingMonth") ? Number(searchParams.get("billingMonth")) : undefined,
    billingYear: searchParams.get("billingYear") ? Number(searchParams.get("billingYear")) : undefined,
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
    if (query.paymentMethod) params.set("paymentMethod", query.paymentMethod);
    if (query.propertyId) params.set("propertyId", query.propertyId);
    if (query.billingMonth) params.set("billingMonth", query.billingMonth.toString());
    if (query.billingYear) params.set("billingYear", query.billingYear.toString());

    router.replace(`${pathname}?${params.toString()}`);
  }, [query, pathname, router]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["payments", query],
    queryFn: () => getPayments(query),
    placeholderData: (previousData) => previousData,
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

  const items: PaymentListItem[] = data?.data?.items || [];
  const meta = data?.data?.meta;

  const completedCount = items.filter((p) => p.status === "COMPLETED").length;
  const pendingCount = items.filter((p) => p.status === "PENDING" || p.status === "FAILED").length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Lịch sử Thanh toán
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Giao dịch tài chính
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Nhật ký biên nhận tiền mặt, chuyển khoản và lịch sử giao dịch của khách thuê
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="self-start sm:self-auto rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-11 px-5 gap-2 shadow-xs"
        >
          <Link href="/dashboard/payments/new">
            <PlusCircle className="h-5 w-5" />
            Thêm Thanh toán
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Grid: 3 Stat Cards with Fixed Height */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Tổng số Giao dịch */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số Giao dịch
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <DollarSign className="h-5 w-5" />
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
                  <span className="text-base font-semibold text-slate-500">biên lai</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Tổng số giao dịch đã ghi nhận</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Đã hoàn tất */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đã hoàn tất
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
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {completedCount}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                    Thành công
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Tiền đã về tài khoản / quỹ</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Đang xử lý / Thất bại */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chờ xử lý / Thất bại
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
                    {pendingCount}
                  </span>
                  <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                    Cần đối soát
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Giao dịch chờ xác nhận</p>
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
              placeholder="Tìm theo mã biên lai, hóa đơn, khách thuê..."
              value={query.search || ""}
              onChange={handleSearchChange}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MethodSelect
              value={query.paymentMethod || "ALL"}
              onChange={(val) =>
                setQuery((prev) => ({
                  ...prev,
                  paymentMethod: val === "ALL" ? undefined : val,
                  page: 1,
                }))
              }
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
          <table className="w-full text-left table-fixed min-w-[950px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                <th className="w-[14%] pb-4 pr-4 whitespace-nowrap">Mã Biên lai</th>
                <th className="w-[14%] pb-4 px-3 whitespace-nowrap">Mã Hóa đơn</th>
                <th className="w-[16%] pb-4 px-3 whitespace-nowrap">Khách thuê</th>
                <th className="w-[20%] pb-4 px-3 whitespace-nowrap">Phòng / Khu trọ</th>
                <th className="w-[14%] pb-4 px-3 whitespace-nowrap">Ngày thanh toán</th>
                <th className="w-[12%] pb-4 px-3 text-right whitespace-nowrap">Số tiền</th>
                <th className="w-[10%] pb-4 px-3 whitespace-nowrap">Phương thức</th>
                <th className="w-[10%] pb-4 pl-3 whitespace-nowrap">Trạng thái</th>
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
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-28 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3 text-right"><Skeleton className="h-6 w-20 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                    <td className="py-4 pl-3"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-red-600">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Clock className="h-10 w-10 text-red-400" />
                      <p className="font-bold text-base">Đã có lỗi xảy ra khi tải danh sách thanh toán</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <DollarSign className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-800 text-base">Không tìm thấy giao dịch thanh toán</p>
                      <p className="text-xs text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 pr-4 font-bold text-slate-900 text-sm truncate">
                      {payment.receiptNumber}
                    </td>
                    <td className="py-4 px-3">
                      <Link
                        href={`/dashboard/invoices`}
                        className="font-bold text-slate-900 hover:text-black transition-colors text-sm hover:underline"
                      >
                        {payment.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-3 font-semibold text-slate-800 text-sm truncate">
                      {payment.tenantName}
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        Phòng {payment.roomCode}
                        <span className="text-slate-500 font-normal text-xs ml-1.5">
                          ({payment.propertyName})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {new Date(payment.paymentDate).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-4 px-3 text-right font-extrabold text-slate-900 text-sm whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-4 px-3">
                      <PaymentMethodBadge method={payment.paymentMethod} />
                    </td>
                    <td className="py-4 pl-3">
                      <PaymentStatusBadge status={payment.status} />
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
              Trang {meta.currentPage} / {meta.totalPages} (Tổng số {meta.totalItems} giao dịch)
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
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Đang tải...</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}
