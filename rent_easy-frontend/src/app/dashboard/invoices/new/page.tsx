"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractService } from "@/services/contract.service";
import { createInvoice } from "@/services/api/invoices";
import { ContractStatus } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePlus, ArrowLeft, PlusCircle, AlertCircle, ChevronDown, Check, DollarSign } from "lucide-react";
import { toast } from "sonner";

const invoiceSchema = z
  .object({
    contractId: z.string().min(1, "Vui lòng chọn hợp đồng"),
    billingMonth: z.number().min(1).max(12),
    billingYear: z.number().min(2000),
    issueDate: z.string().min(1, "Vui lòng chọn ngày lập hóa đơn"),
    dueDate: z.string().min(1, "Vui lòng chọn ngày đến hạn"),
    electricityAmount: z.number().min(0),
    waterAmount: z.number().min(0),
    serviceAmount: z.number().min(0),
    otherAmount: z.number().min(0),
    discountAmount: z.number().min(0),
    note: z.string().optional(),
  })
  .refine((data) => new Date(data.issueDate) <= new Date(data.dueDate), {
    message: "Ngày lập không được lớn hơn ngày đến hạn",
    path: ["issueDate"],
  });

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

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
                Không có hợp đồng khả dụng
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

export default function CreateInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch active contracts
  const { data: contractsData, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", "active"],
    queryFn: () => ContractService.getContracts({ limit: 100, status: ContractStatus.ACTIVE }),
  });

  const contracts = contractsData?.data?.items || [];

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contractId: "",
      billingMonth: new Date().getMonth() + 1,
      billingYear: new Date().getFullYear(),
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      electricityAmount: 0,
      waterAmount: 0,
      serviceAmount: 0,
      otherAmount: 0,
      discountAmount: 0,
      note: "",
    },
  });

  const contractId = useWatch({ control: form.control, name: "contractId" });
  const electricityAmount = useWatch({ control: form.control, name: "electricityAmount" }) || 0;
  const waterAmount = useWatch({ control: form.control, name: "waterAmount" }) || 0;
  const serviceAmount = useWatch({ control: form.control, name: "serviceAmount" }) || 0;
  const otherAmount = useWatch({ control: form.control, name: "otherAmount" }) || 0;
  const discountAmount = useWatch({ control: form.control, name: "discountAmount" }) || 0;

  const selectedContract = useMemo(() => {
    return contracts.find((c) => c.id === contractId);
  }, [contracts, contractId]);

  const totalAmount = useMemo(() => {
    const roomRent = selectedContract?.monthlyRent || 0;
    return roomRent + electricityAmount + waterAmount + serviceAmount + otherAmount - discountAmount;
  }, [selectedContract, electricityAmount, waterAmount, serviceAmount, otherAmount, discountAmount]);

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      toast.success("Tạo hóa đơn thành công!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push("/dashboard/invoices");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi tạo hóa đơn";
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const onSubmit = (values: InvoiceFormValues) => {
    setErrorMsg(null);
    mutation.mutate({
      ...values,
      issueDate: new Date(values.issueDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const contractOptions = contracts.map((c) => ({
    label: `${c.contractNumber} - ${c.tenantName} (Phòng ${c.roomCode})`,
    value: c.id,
  }));

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
              <FilePlus className="h-7 w-7 text-slate-900" />
              Tạo Hóa đơn Mới
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Phát hành hóa đơn tiền phòng và dịch vụ hàng tháng cho khách thuê
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: General Info */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Thông tin chung & Hợp đồng
            </h2>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">
                Hợp đồng thuê trọ <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="contractId"
                control={form.control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={contractOptions}
                    placeholder={isLoadingContracts ? "Đang tải danh sách HĐ..." : "-- Chọn hợp đồng đang hiệu lực --"}
                    disabled={isLoadingContracts}
                  />
                )}
              />
              {form.formState.errors.contractId && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {form.formState.errors.contractId.message}
                </p>
              )}
            </div>

            {selectedContract && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Khách thuê:</span>
                  <span className="font-bold text-slate-900">{selectedContract.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Phòng / Khu trọ:</span>
                  <span className="font-bold text-slate-900">
                    Phòng {selectedContract.roomCode} ({selectedContract.propertyName})
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-500">Tiền phòng cố định:</span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(Number(selectedContract.monthlyRent))}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingMonth" className="text-sm font-bold text-slate-800">
                  Kỳ hóa đơn (Tháng) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="billingMonth"
                  type="number"
                  {...form.register("billingMonth", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
                />
                {form.formState.errors.billingMonth && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    {form.formState.errors.billingMonth.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingYear" className="text-sm font-bold text-slate-800">
                  Kỳ hóa đơn (Năm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="billingYear"
                  type="number"
                  {...form.register("billingYear", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
                />
                {form.formState.errors.billingYear && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    {form.formState.errors.billingYear.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate" className="text-sm font-bold text-slate-800">
                  Ngày lập hóa đơn <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...form.register("issueDate")}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
                />
                {form.formState.errors.issueDate && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    {form.formState.errors.issueDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-bold text-slate-800">
                  Ngày đến hạn <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate")}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
                />
                {form.formState.errors.dueDate && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-bold text-slate-800">
                Ghi chú hóa đơn
              </Label>
              <textarea
                id="note"
                {...form.register("note")}
                rows={3}
                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                placeholder="Ví dụ: Tiền điện tháng 8..."
              />
            </div>
          </div>

          {/* Column 2: Fee Amounts Breakdown */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Các khoản chi phí dịch vụ
              </h2>

              <div className="space-y-2">
                <Label htmlFor="electricityAmount" className="text-sm font-bold text-slate-800">
                  Tiền điện (VNĐ)
                </Label>
                <Input
                  id="electricityAmount"
                  type="number"
                  {...form.register("electricityAmount", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waterAmount" className="text-sm font-bold text-slate-800">
                  Tiền nước (VNĐ)
                </Label>
                <Input
                  id="waterAmount"
                  type="number"
                  {...form.register("waterAmount", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceAmount" className="text-sm font-bold text-slate-800">
                  Tiền dịch vụ (rác, internet...) (VNĐ)
                </Label>
                <Input
                  id="serviceAmount"
                  type="number"
                  {...form.register("serviceAmount", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherAmount" className="text-sm font-bold text-slate-800">
                  Phụ phí phát sinh khác (VNĐ)
                </Label>
                <Input
                  id="otherAmount"
                  type="number"
                  {...form.register("otherAmount", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountAmount" className="text-sm font-bold text-slate-800">
                  Giảm giá / Ưu đãi (VNĐ)
                </Label>
                <Input
                  id="discountAmount"
                  type="number"
                  {...form.register("discountAmount", { valueAsNumber: true })}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>
            </div>

            {/* Total Highlight Bar */}
            <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-900 flex justify-between items-center mt-6 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tổng hóa đơn thực thu:
              </span>
              <span className="text-2xl font-black text-emerald-800">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={mutation.isPending}
            className="rounded-xl border-slate-300 text-slate-800 font-bold h-11 px-5 text-sm"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            {mutation.isPending ? "Đang phát hành..." : "Phát hành Hóa đơn"}
          </Button>
        </div>
      </form>
    </div>
  );
}
