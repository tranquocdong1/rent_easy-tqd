"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useContract, useActivateContract, useTerminateContract } from "@/hooks/use-contracts";
import { ContractStatus } from "@/types/contract";
import { getInvoices } from "@/services/api/invoices";
import { getPayments } from "@/services/api/payments";
import { InvoiceStatus, InvoiceListItem } from "@/types/invoice";
import { PaymentStatus, PaymentMethod, PaymentListItem } from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  ArrowLeft,
  Pencil,
  Power,
  Ban,
  Building2,
  User,
  DollarSign,
  Receipt,
  AlertCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
};

const StatusBadge = ({ status }: { status: ContractStatus }) => {
  const statusMap: Record<ContractStatus, string> = {
    [ContractStatus.PENDING]: "Chờ duyệt",
    [ContractStatus.ACTIVE]: "Đang hiệu lực",
    [ContractStatus.EXPIRED]: "Đã hết hạn",
    [ContractStatus.TERMINATED]: "Đã chấm dứt",
    [ContractStatus.CANCELLED]: "Đã huỷ",
  };

  if (status === ContractStatus.ACTIVE) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Đang hiệu lực
      </span>
    );
  }

  if (status === ContractStatus.PENDING) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Chờ duyệt
      </span>
    );
  }

  if (status === ContractStatus.EXPIRED) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Đã hết hạn
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/80">
      {statusMap[status]}
    </span>
  );
};

/* Invoice Status Badge Component */
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
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200/80 font-semibold text-xs whitespace-nowrap">
      {status === "OVERDUE" ? "Quá hạn" : status === "CANCELLED" ? "Đã hủy" : "Nháp"}
    </span>
  );
}

/* Payment Status & Method Badge Component */
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

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { data, isLoading, error } = useContract(contractId);

  const [activeTab, setActiveTab] = useState<"info" | "invoices" | "payments">("info");

  // Query Invoices for this contract
  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", "contract", contractId],
    queryFn: () => getInvoices({ contractId, limit: 100 }),
    enabled: !!contractId && activeTab === "invoices",
  });

  // Query Payments for this contract
  const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments", "contract", contractId],
    queryFn: () => getPayments({ contractId, limit: 100 }),
    enabled: !!contractId && activeTab === "payments",
  });

  const [activateOpen, setActivateOpen] = useState(false);
  const activateMutation = useActivateContract();

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(contractId);
      toast.success("Kích hoạt hợp đồng thành công");
      setActivateOpen(false);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error(error.response.data?.message || "Không thể kích hoạt hợp đồng.");
      } else {
        toast.error("Đã xảy ra lỗi khi kích hoạt hợp đồng.");
      }
      setActivateOpen(false);
    }
  };

  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateDate, setTerminateDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [terminateReason, setTerminateReason] = useState("");
  const terminateMutation = useTerminateContract();

  const handleTerminate = async () => {
    try {
      await terminateMutation.mutateAsync({
        id: contractId,
        payload: { terminatedDate: terminateDate, reason: terminateReason },
      });
      toast.success("Chấm dứt hợp đồng thành công");
      setTerminateOpen(false);
      setTerminateDate(format(new Date(), "yyyy-MM-dd"));
      setTerminateReason("");
    } catch (error: any) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Đã xảy ra lỗi khi chấm dứt hợp đồng.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200/90 shadow-2xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy hợp đồng</h2>
        <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
          Hợp đồng này có thể đã bị xóa hoặc không tồn tại trên hệ thống.
        </p>
        <Button
          onClick={() => router.push("/dashboard/contracts")}
          className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 h-10"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const contract = data.data;
  const contractInvoices: InvoiceListItem[] = invoicesResponse?.data?.items || [];
  const contractPayments: PaymentListItem[] = paymentsResponse?.data?.items || [];

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
                Hợp đồng: {contract.contractNumber}
              </h1>
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Phòng {contract.room.code} - {contract.property.name} | Thuộc khách thuê: {contract.tenant.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {contract.status === ContractStatus.PENDING && (
            <Button
              onClick={() => setActivateOpen(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-10 px-4 gap-2 shadow-xs"
            >
              <Power className="h-4 w-4" />
              Kích hoạt
            </Button>
          )}
          {contract.status === ContractStatus.ACTIVE && (
            <Button
              onClick={() => {
                setTerminateDate(format(new Date(), "yyyy-MM-dd"));
                setTerminateReason("");
                setTerminateOpen(true);
              }}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm h-10 px-4 gap-2 shadow-xs"
            >
              <Ban className="h-4 w-4" />
              Chấm dứt
            </Button>
          )}
          <Button
            asChild
            className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-10 px-4 gap-2 shadow-xs"
          >
            <Link href={`/dashboard/contracts/${contract.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Hero Card / Summary Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tiền thuê hàng tháng
          </span>
          <p className="text-xl font-black text-slate-900">
            {formatCurrency(contract.monthlyRent)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Số tiền đặt cọc
          </span>
          <p className="text-xl font-black text-slate-900">
            {formatCurrency(contract.depositAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Thời hạn pháp lý
          </span>
          <p className="text-sm font-bold text-slate-900 leading-snug mt-1">
            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Đã thanh toán thực tế
          </span>
          <p className="text-xl font-black text-emerald-700">
            {formatCurrency(contract.summary?.totalPaid || 0)}
          </p>
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
          Thông tin hợp đồng
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "invoices"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Danh sách Hóa đơn
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "payments"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Lịch sử Thanh toán
        </button>
      </div>

      {/* 4. Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Tenant & Property Info */}
            <div className="space-y-6">
              {/* Tenant Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5.5 w-5.5 text-slate-900" />
                    <h3 className="text-lg font-bold text-slate-900">Khách thuê đứng tên</h3>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs font-bold border-slate-300 text-slate-900"
                  >
                    <Link href={`/dashboard/tenants/${contract.tenant.id}`}>Xem hồ sơ</Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Họ và tên
                    </span>
                    <p className="text-base font-bold text-slate-900">{contract.tenant.fullName}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Số điện thoại
                    </span>
                    <p className="text-base font-bold text-slate-900">{contract.tenant.phone}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Số CCCD / CMND
                  </span>
                  <p className="text-base font-extrabold text-slate-900">
                    {contract.tenant.identityNumber}
                  </p>
                </div>
              </div>

              {/* Property & Room Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5.5 w-5.5 text-slate-900" />
                    <h3 className="text-lg font-bold text-slate-900">Bất động sản & Phòng trọ</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tên khu trọ
                    </span>
                    <p className="text-base font-bold text-slate-900">{contract.property.name}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mã phòng trọ
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      {contract.room.name} ({contract.room.code})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contract Summary & Terms */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <FileText className="h-5.5 w-5.5 text-slate-900" />
                  <h3 className="text-lg font-bold text-slate-900">Thống kê tài chính hợp đồng</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tổng số hóa đơn
                    </span>
                    <p className="text-2xl font-black text-slate-900">
                      {contract.summary?.totalInvoices || 0}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-red-50/70 border border-red-200/80 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                      Hóa đơn chưa thanh toán
                    </span>
                    <p className="text-2xl font-black text-red-700">
                      {contract.summary?.unpaidInvoices || 0}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ghi chú chi tiết hợp đồng
                  </span>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {contract.note || "Không có ghi chú bổ sung."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Danh sách Hóa đơn liên quan */}
        {activeTab === "invoices" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Danh sách Hóa đơn của hợp đồng</h3>
              </div>
              <Button
                asChild
                size="sm"
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4"
              >
                <Link href="/dashboard/invoices/new">+ Tạo Hóa đơn mới</Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[750px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                    <th className="w-[18%] pb-3 pr-3">Mã Hóa đơn</th>
                    <th className="w-[16%] pb-3 px-2">Kỳ thanh toán</th>
                    <th className="w-[18%] pb-3 px-2">Hạn thanh toán</th>
                    <th className="w-[18%] pb-3 px-2 text-right">Tổng tiền</th>
                    <th className="w-[16%] pb-3 px-2">Trạng thái</th>
                    <th className="w-[14%] pb-3 pl-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingInvoices ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 pr-3"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                        <td className="py-3.5 px-2 text-right"><Skeleton className="h-5 w-20 ml-auto rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                        <td className="py-3.5 pl-2 text-right"><Skeleton className="h-5 w-16 ml-auto rounded-lg" /></td>
                      </tr>
                    ))
                  ) : contractInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Receipt className="h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-800 text-sm">Chưa có hóa đơn nào</p>
                          <p className="text-xs text-slate-500">Hợp đồng này chưa có lịch sử hóa đơn phát hành</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contractInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-3 font-bold text-slate-900 text-sm">
                          <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline text-slate-900">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-2 text-xs font-semibold text-slate-700">
                          {inv.billingPeriod}
                        </td>
                        <td className="py-3.5 px-2 text-xs font-medium text-slate-600">
                          {new Date(inv.dueDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-2 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-3.5 px-2">
                          <InvoiceBadge status={inv.status} />
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white"
                          >
                            <Link href={`/dashboard/invoices/${inv.id}`}>
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
        )}

        {/* Tab 3: Lịch sử Thanh toán */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Nhật ký Biên lai Thanh toán</h3>
              </div>
              <Button
                asChild
                size="sm"
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4"
              >
                <Link href="/dashboard/payments/new">+ Thêm Thanh toán</Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[750px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                    <th className="w-[18%] pb-3 pr-3">Mã Biên lai</th>
                    <th className="w-[18%] pb-3 px-2">Mã Hóa đơn</th>
                    <th className="w-[20%] pb-3 px-2">Ngày giao dịch</th>
                    <th className="w-[18%] pb-3 px-2 text-right">Số tiền nộp</th>
                    <th className="w-[14%] pb-3 px-2">Phương thức</th>
                    <th className="w-[12%] pb-3 pl-2 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingPayments ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 pr-3"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-28 rounded-lg" /></td>
                        <td className="py-3.5 px-2 text-right"><Skeleton className="h-5 w-20 ml-auto rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-16 rounded-lg" /></td>
                        <td className="py-3.5 pl-2 text-right"><Skeleton className="h-5 w-20 ml-auto rounded-lg" /></td>
                      </tr>
                    ))
                  ) : contractPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <DollarSign className="h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-800 text-sm">Chưa có giao dịch thanh toán</p>
                          <p className="text-xs text-slate-500">Chưa ghi nhận biên nhận thu tiền nào cho hợp đồng này</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contractPayments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-3 font-bold text-slate-900 text-sm">
                          {pmt.receiptNumber}
                        </td>
                        <td className="py-3.5 px-2 text-xs font-bold text-slate-800">
                          {pmt.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-2 text-xs font-medium text-slate-600">
                          {new Date(pmt.paymentDate).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-2 text-right font-extrabold text-slate-900 text-sm">
                          {formatCurrency(pmt.amount)}
                        </td>
                        <td className="py-3.5 px-2">
                          <PaymentMethodBadge method={pmt.paymentMethod} />
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <PaymentStatusBadge status={pmt.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Activate Confirmation Alert Dialog */}
      <AlertDialog open={activateOpen} onOpenChange={setActivateOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Power className="h-5 w-5 text-emerald-600" />
              Kích hoạt Hợp đồng
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2 space-y-1">
              <span>Bạn có chắc chắn muốn kích hoạt hợp đồng này?</span>
              <ul className="list-disc pl-5 pt-2 text-xs font-semibold text-slate-700 space-y-1">
                <li>Hợp đồng sẽ chuyển sang <b>Đang hiệu lực (ACTIVE)</b></li>
                <li>Trạng thái phòng sẽ chuyển sang <b>Đang thuê (OCCUPIED)</b></li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              disabled={activateMutation.isPending}
              onClick={() => setActivateOpen(false)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleActivate();
              }}
              disabled={activateMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {activateMutation.isPending ? "Đang kích hoạt..." : "Kích hoạt hợp đồng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate Confirmation Alert Dialog */}
      <AlertDialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-600" />
              Chấm dứt Hợp đồng sớm
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 font-medium">
              Chấm dứt hợp đồng sớm trước thời hạn pháp lý. Trạng thái phòng sẽ được trả về Còn trống (AVAILABLE).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500 font-medium">
              Chấm dứt hợp đồng sớm trước thời hạn pháp lý. Trạng thái phòng sẽ được trả về Còn trống (AVAILABLE).
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Ngày chấm dứt *</label>
              <Input
                type="date"
                value={terminateDate}
                onChange={(e) => setTerminateDate(e.target.value)}
                disabled={terminateMutation.isPending}
                className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Lý do chấm dứt</label>
              <textarea
                rows={3}
                className="flex w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                placeholder="Nhập lý do kết thúc hợp đồng..."
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                disabled={terminateMutation.isPending}
              />
            </div>
          </div>
          <AlertDialogFooter className="mt-2 flex items-center gap-2">
            <AlertDialogCancel
              disabled={terminateMutation.isPending}
              onClick={() => setTerminateOpen(false)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleTerminate();
              }}
              disabled={terminateMutation.isPending || !terminateDate}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {terminateMutation.isPending ? "Đang chấm dứt..." : "Chấm dứt hợp đồng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
