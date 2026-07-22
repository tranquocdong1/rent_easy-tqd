"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoiceById, updateInvoice } from "@/services/api/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, ArrowLeft, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const invoiceSchema = z
  .object({
    issueDate: z.string().min(1, "Vui lòng chọn ngày lập hóa đơn"),
    dueDate: z.string().min(1, "Vui lòng chọn ngày đến hạn"),
    electricityAmount: z.number().min(0),
    waterAmount: z.number().min(0),
    serviceAmount: z.number().min(0),
    otherAmount: z.number().min(0),
    discountAmount: z.number().min(0),
    note: z.string().optional().nullable(),
  })
  .refine((data) => new Date(data.issueDate) <= new Date(data.dueDate), {
    message: "Ngày lập không được lớn hơn ngày đến hạn",
    path: ["issueDate"],
  });

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });

  const invoice = response?.data;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issueDate: "",
      dueDate: "",
      electricityAmount: 0,
      waterAmount: 0,
      serviceAmount: 0,
      otherAmount: 0,
      discountAmount: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        issueDate: new Date(invoice.issueDate).toISOString().split("T")[0],
        dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
        electricityAmount: Number(invoice.electricityAmount),
        waterAmount: Number(invoice.waterAmount),
        serviceAmount: Number(invoice.serviceAmount),
        otherAmount: Number(invoice.otherAmount),
        discountAmount: Number(invoice.discountAmount),
        note: invoice.note || "",
      });
    }
  }, [invoice, form]);

  const electricityAmount = useWatch({ control: form.control, name: "electricityAmount" }) || 0;
  const waterAmount = useWatch({ control: form.control, name: "waterAmount" }) || 0;
  const serviceAmount = useWatch({ control: form.control, name: "serviceAmount" }) || 0;
  const otherAmount = useWatch({ control: form.control, name: "otherAmount" }) || 0;
  const discountAmount = useWatch({ control: form.control, name: "discountAmount" }) || 0;

  const totalAmount = useMemo(() => {
    const roomRent = invoice?.roomRent || 0;
    return roomRent + electricityAmount + waterAmount + serviceAmount + otherAmount - discountAmount;
  }, [invoice?.roomRent, electricityAmount, waterAmount, serviceAmount, otherAmount, discountAmount]);

  const mutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      updateInvoice(id, {
        ...values,
        note: values.note || undefined,
        issueDate: new Date(values.issueDate).toISOString(),
        dueDate: new Date(values.dueDate).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Cập nhật hóa đơn thành công!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      router.push("/dashboard/invoices");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi cập nhật hóa đơn";
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const onSubmit = (values: InvoiceFormValues) => {
    if (!form.formState.isDirty) {
      router.push("/dashboard/invoices");
      return;
    }
    setErrorMsg(null);
    mutation.mutate(values);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200/90 shadow-2xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy hóa đơn</h2>
        <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
          Hóa đơn không tồn tại hoặc bạn không có quyền truy cập thông tin này.
        </p>
        <Button
          onClick={() => router.replace("/dashboard/invoices")}
          className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 h-10"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Receipt className="h-7 w-7 text-slate-900" />
                Cập nhật Hóa đơn: {invoice.invoiceNumber}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                {invoice.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Chỉnh sửa chi phí dịch vụ và hạn thanh toán của hóa đơn
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

      {invoice.status !== "UNPAID" && (
        <div className="p-4 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span>
            Hóa đơn này không ở trạng thái Chưa thanh toán (UNPAID), bạn không thể chỉnh sửa chi phí.
          </span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Readonly Info & General */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Thông tin tổng quan
            </h2>

            {/* Readonly Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Kỳ hóa đơn:</span>
                <span className="font-bold text-slate-900">
                  {invoice.billingPeriod || `${String(invoice.billingMonth).padStart(2, "0")}/${invoice.billingYear}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Khách thuê:</span>
                <span className="font-bold text-slate-900">
                  {invoice.tenant?.fullName || invoice.tenantName || "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Phòng / Khu trọ:</span>
                <span className="font-bold text-slate-900">
                  Phòng {invoice.room?.code || invoice.roomCode || "---"} (
                  {invoice.property?.name || invoice.propertyName || "---"})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="font-semibold text-slate-500">Tiền phòng cố định:</span>
                <span className="font-extrabold text-slate-900">
                  {formatCurrency(Number(invoice.roomRent))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate" className="text-sm font-bold text-slate-800">
                  Ngày lập *
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...form.register("issueDate")}
                  disabled={invoice.status !== "UNPAID"}
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
                  Ngày đến hạn *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate")}
                  disabled={invoice.status !== "UNPAID"}
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
                disabled={invoice.status !== "UNPAID"}
                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
                placeholder="Điều chỉnh chi phí..."
              />
            </div>
          </div>

          {/* Column 2: Fees Breakdown */}
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
                  disabled={invoice.status !== "UNPAID"}
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
                  disabled={invoice.status !== "UNPAID"}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceAmount" className="text-sm font-bold text-slate-800">
                  Tiền dịch vụ (VNĐ)
                </Label>
                <Input
                  id="serviceAmount"
                  type="number"
                  {...form.register("serviceAmount", { valueAsNumber: true })}
                  disabled={invoice.status !== "UNPAID"}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherAmount" className="text-sm font-bold text-slate-800">
                  Phụ phí phát sinh (VNĐ)
                </Label>
                <Input
                  id="otherAmount"
                  type="number"
                  {...form.register("otherAmount", { valueAsNumber: true })}
                  disabled={invoice.status !== "UNPAID"}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountAmount" className="text-sm font-bold text-slate-800">
                  Giảm giá / Khuyến mãi (VNĐ)
                </Label>
                <Input
                  id="discountAmount"
                  type="number"
                  {...form.register("discountAmount", { valueAsNumber: true })}
                  disabled={invoice.status !== "UNPAID"}
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
            disabled={mutation.isPending || invoice.status !== "UNPAID" || !form.formState.isDirty}
            className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
          >
            <Save className="h-4.5 w-4.5" />
            {mutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
