"use client";

import { useState } from "react";
import { useForm as useHookForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getInvoices } from "@/services/api/invoices";
import { createPayment } from "@/services/api/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethod } from "@/types/payment";
import { InvoiceStatus } from "@/types/invoice";
import { ArrowLeft, PlusCircle, AlertCircle, ChevronDown, Check, DollarSign, Receipt, CreditCard } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  invoiceId: z.string().min(1, "Vui lòng chọn hóa đơn"),
  paymentDate: z.string().min(1, "Vui lòng chọn ngày thanh toán"),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD"]),
  referenceNumber: z.string().max(100, "Tối đa 100 ký tự").optional(),
  note: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
});

type FormValues = z.infer<typeof formSchema>;

/* Custom Popover Select Component */
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  disabled = false,
}: {
  value?: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 transition-colors shadow-2xs hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500 font-medium text-center">
                Không có hóa đơn chưa thanh toán
              </div>
            ) : (
              options.map((option) => (
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
                  <span className="truncate pr-2">{option.label}</span>
                  {value === option.value && <Check className="h-4 w-4 text-slate-900 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CreatePaymentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", "pending"],
    queryFn: () =>
      getInvoices({ statuses: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID], limit: 100 }),
  });

  const invoices = invoicesData?.data?.items || [];
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useHookForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 16),
      amount: 0,
      paymentMethod: "CASH",
      referenceNumber: "",
      note: "",
    },
  });

  const amount = watch("amount");

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      toast.success("Tạo thanh toán thành công!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (selectedInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ["invoice", selectedInvoiceId] });
      }
      router.push("/dashboard/payments");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán";
      toast.error(msg);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (selectedInvoice && data.amount > selectedInvoice.remainingAmount) {
      toast.error("Số tiền thanh toán không được lớn hơn số tiền còn lại của hóa đơn.");
      return;
    }

    createMutation.mutate({
      ...data,
      paymentDate: new Date(data.paymentDate).toISOString(),
    });
  };

  const handleInvoiceChange = (val: string) => {
    setSelectedInvoiceId(val);
    setValue("invoiceId", val, { shouldValidate: true });

    // Auto fill remaining amount
    const inv = invoices.find((i) => i.id === val);
    if (inv) {
      setValue("amount", inv.remainingAmount, { shouldValidate: true });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const invoiceOptions = invoices.map((inv) => ({
    label: `${inv.invoiceNumber} - ${inv.tenantName} (Phòng ${inv.roomCode})`,
    value: inv.id,
  }));

  const methodOptions: { label: string; value: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" }[] = [
    { label: "Tiền mặt", value: "CASH" },
    { label: "Chuyển khoản", value: "BANK_TRANSFER" },
    { label: "Thẻ tín dụng", value: "CREDIT_CARD" },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-slate-900" />
              Ghi nhận Thanh toán Mới
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Lập biên lai xác nhận đã thu tiền từ khách thuê theo hóa đơn hàng tháng
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Thông tin thanh toán
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">
                Hóa đơn thanh toán <span className="text-red-500">*</span>
              </Label>
              <CustomSelect
                value={selectedInvoiceId}
                onChange={handleInvoiceChange}
                options={invoiceOptions}
                placeholder={
                  isLoadingInvoices
                    ? "Đang tải hóa đơn..."
                    : "-- Chọn hóa đơn chưa thanh toán --"
                }
                disabled={isLoadingInvoices}
              />
              {errors.invoiceId && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.invoiceId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate" className="text-sm font-bold text-slate-800">
                Thời gian giao dịch <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="datetime-local"
                {...register("paymentDate")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.paymentDate && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.paymentDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-bold text-slate-800">
                Số tiền nộp (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                {...register("amount")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.amount && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.amount.message}</p>
              )}
              {selectedInvoice && amount > selectedInvoice.remainingAmount && (
                <p className="text-xs font-semibold text-amber-700 mt-1">
                  Lưu ý: Số tiền nộp đang lớn hơn số tiền còn nợ của hóa đơn ({formatCurrency(selectedInvoice.remainingAmount)}).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">
                Phương thức thanh toán <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={methodOptions}
                  />
                )}
              />
              {errors.paymentMethod && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber" className="text-sm font-bold text-slate-800">
                Mã tham chiếu / Mã giao dịch ngân hàng
              </Label>
              <Input
                id="referenceNumber"
                placeholder="Ví dụ: FT240815123456"
                {...register("referenceNumber")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.referenceNumber && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.referenceNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-bold text-slate-800">
                Ghi chú thêm
              </Label>
              <textarea
                id="note"
                {...register("note")}
                rows={3}
                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                placeholder="Ghi chú xác nhận tiền..."
              />
              {errors.note && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.note.message}</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
                className="rounded-xl border-slate-300 text-slate-800 font-bold h-11 px-5 text-sm"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !selectedInvoiceId}
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                {createMutation.isPending ? "Đang xử lý..." : "Lập Biên Lai Thanh Toán"}
              </Button>
            </div>
          </form>
        </div>

        {/* Invoice Summary Card */}
        <div className="space-y-4">
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Receipt className="h-6 w-6 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">Chi tiết Hóa đơn nợ</h3>
              </div>

              <div className="space-y-2.5 text-sm font-medium text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã hóa đơn:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách thuê:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phòng & Khu trọ:</span>
                  <span className="font-bold text-slate-900">
                    Phòng {selectedInvoice.roomCode} ({selectedInvoice.propertyName})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạn thanh toán:</span>
                  <span className="font-bold text-amber-800">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tổng hóa đơn gốc:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Đã thanh toán trước đó:</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(selectedInvoice.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-lg font-black text-slate-900">
                    <span>Số tiền nợ còn lại:</span>
                    <span className="text-amber-800 text-xl font-black">
                      {formatCurrency(selectedInvoice.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center text-slate-500 h-full flex flex-col items-center justify-center min-h-[350px] space-y-3">
              <div className="p-4 rounded-2xl bg-slate-100 text-slate-400">
                <Receipt className="h-8 w-8" />
              </div>
              <p className="font-bold text-slate-800 text-base">Chưa chọn Hóa đơn</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Vui lòng chọn một hóa đơn từ danh sách bên trái để xem nợ tồn đọng và lập biên lai
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
