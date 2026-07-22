"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById } from "@/services/api/invoices";
import { getPayments } from "@/services/api/payments";
import { InvoiceStatus } from "@/types/invoice";
import { PaymentStatus, PaymentMethod, PaymentListItem } from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useState } from "react";
import {
  Receipt,
  ArrowLeft,
  Pencil,
  User,
  Building2,
  DollarSign,
  AlertCircle,
  CreditCard,
  PlusCircle,
} from "lucide-react";

/* Status Badge Component - Softer Harmonious Colors */
function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
        <span className="h-2 w-2 rounded-full bg-emerald-600" />
        Đã thanh toán
      </span>
    );
  }
  if (status === "UNPAID") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/70">
        <span className="h-2 w-2 rounded-full bg-amber-600" />
        Chưa thanh toán
      </span>
    );
  }
  if (status === "PARTIALLY_PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200/70">
        Thanh toán 1 phần
      </span>
    );
  }
  if (status === "OVERDUE" || status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200/70">
        {status === "OVERDUE" ? "Quá hạn" : "Đã hủy"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
      Nháp
    </span>
  );
}

/* Payment Status & Method Badge Component */
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold text-xs whitespace-nowrap">
        Đã thanh toán
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/70 font-semibold text-xs whitespace-nowrap">
        Đang xử lý
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200/70 font-semibold text-xs whitespace-nowrap">
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"details" | "payments">("details");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });

  // Query Payments for this specific invoice
  const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments", "invoice", id],
    queryFn: () => getPayments({ invoiceId: id, limit: 100 }),
    enabled: !!id && activeTab === "payments",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
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

  if (isError || !data?.data) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200/90 shadow-2xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy hóa đơn</h2>
        <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
          Hóa đơn này không tồn tại hoặc bạn không có quyền truy cập thông tin này.
        </p>
        <Button
          onClick={() => router.push("/dashboard/invoices")}
          className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-6 h-10"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const invoice = data.data;
  const invoicePayments: PaymentListItem[] = paymentsResponse?.data?.items || [];
  const paidAmount = Number(invoice.summary?.paidAmount ?? invoice.paidAmount ?? 0);
  const remainingAmount = Number(
    invoice.summary?.remainingAmount ?? invoice.remainingAmount ?? 0
  );
  const totalAmount = Number(
    invoice.totalAmount || paidAmount + remainingAmount
  );

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
                Hóa đơn: {invoice.invoiceNumber}
              </h1>
              <InvoiceBadge status={invoice.status} />
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Kỳ hóa đơn: Tháng {String(invoice.billingMonth).padStart(2, "0")}/{invoice.billingYear} | Ngày đến hạn: {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <Button
          asChild
          className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm h-10 px-4 gap-2 shadow-2xs self-start sm:self-auto"
        >
          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      {/* 2. Hero Summary Grid: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Invoice General */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Receipt className="h-4.5 w-4.5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">Hóa đơn & Kỳ thu</h3>
          </div>
          <div className="space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã hóa đơn:</span>
              <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày lập:</span>
              <span>{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Đến hạn:</span>
              <span className="text-amber-800 font-bold">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tenant Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <User className="h-4.5 w-4.5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">Khách thuê</h3>
          </div>
          <div className="space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-bold text-slate-900">
                {invoice.tenant?.fullName || invoice.tenantName || "---"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số điện thoại:</span>
              <span>{invoice.tenant?.phone || "---"}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Room Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Building2 className="h-4.5 w-4.5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">Phòng & Khu trọ</h3>
          </div>
          <div className="space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã phòng:</span>
              <span className="font-bold text-slate-900">
                {invoice.room?.code || invoice.roomCode || "---"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tên nhà trọ:</span>
              <span className="truncate max-w-[120px]">
                {invoice.property?.name || invoice.propertyName || "---"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Financial Overview - Soft Harmonious Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
            <DollarSign className="h-4.5 w-4.5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">Tổng quan Tài chính</h3>
          </div>
          <div className="space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Đã thanh toán:</span>
              <span className="text-emerald-700 font-bold">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200/60">
              <span className="text-slate-900 font-bold">Còn lại:</span>
              <span className="text-amber-800 font-extrabold">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "details"
              ? "bg-slate-800 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Chi tiết khoản thu
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "payments"
              ? "bg-slate-800 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Lịch sử thanh toán
        </button>
      </div>

      {/* 4. Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "details" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Khoản mục chi phí</th>
                  <th className="px-6 py-4 text-right">Số tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-normal">Tiền thuê phòng cố định</td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                    {formatCurrency(Number(invoice.roomRent))}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-normal">Tiền điện tiêu thụ</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(Number(invoice.electricityAmount))}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-normal">Tiền nước sinh hoạt</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(Number(invoice.waterAmount))}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-normal">Tiền dịch vụ chung (rác, wifi...)</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(Number(invoice.serviceAmount))}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-normal">Phụ phí phát sinh khác</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(Number(invoice.otherAmount))}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors text-red-600">
                  <td className="px-6 py-4 font-normal">Giảm giá / Chiết khấu</td>
                  <td className="px-6 py-4 text-right font-bold">
                    - {formatCurrency(Number(invoice.discountAmount))}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-100/90 text-slate-900 font-extrabold text-base border-t border-slate-200">
                <tr>
                  <td className="px-6 py-4 text-slate-800">TỔNG CỘNG HÓA ĐƠN</td>
                  <td className="px-6 py-4 text-right text-emerald-800 text-xl font-black">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {invoice.note && (
              <div className="p-6 border-t border-slate-200 bg-amber-50/40">
                <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1">
                  Ghi chú hóa đơn:
                </h4>
                <p className="text-sm font-medium text-amber-800 whitespace-pre-wrap">{invoice.note}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Lịch sử Thanh toán */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Lịch sử Biên lai Thanh toán cho Hóa đơn này</h3>
              </div>
              <Button
                asChild
                size="sm"
                className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs h-9 px-4 gap-1.5"
              >
                <Link href="/dashboard/payments/new">
                  <PlusCircle className="h-4 w-4" />
                  Thêm Thanh toán
                </Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[700px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                    <th className="w-[20%] pb-3 pr-3">Mã Biên lai</th>
                    <th className="w-[25%] pb-3 px-2">Ngày giao dịch</th>
                    <th className="w-[22%] pb-3 px-2 text-right">Số tiền nộp</th>
                    <th className="w-[18%] pb-3 px-2">Phương thức</th>
                    <th className="w-[15%] pb-3 pl-2 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingPayments ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 pr-3"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-32 rounded-lg" /></td>
                        <td className="py-3.5 px-2 text-right"><Skeleton className="h-5 w-24 ml-auto rounded-lg" /></td>
                        <td className="py-3.5 px-2"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                        <td className="py-3.5 pl-2 text-right"><Skeleton className="h-5 w-20 ml-auto rounded-lg" /></td>
                      </tr>
                    ))
                  ) : invoicePayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CreditCard className="h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-800 text-sm">Chưa có giao dịch thanh toán</p>
                          <p className="text-xs text-slate-500">Hóa đơn này chưa ghi nhận biên lai thu tiền nào</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoicePayments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-3 font-bold text-slate-900 text-sm">
                          {pmt.receiptNumber}
                        </td>
                        <td className="py-3.5 px-2 text-xs font-semibold text-slate-700">
                          {new Date(pmt.paymentDate).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-2 text-right font-black text-slate-900 text-sm">
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
    </div>
  );
}
