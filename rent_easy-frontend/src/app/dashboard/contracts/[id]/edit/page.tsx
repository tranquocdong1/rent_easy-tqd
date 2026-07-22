"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useContract, useUpdateContract } from "@/hooks/use-contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft, Save, AlertCircle } from "lucide-react";

const contractUpdateSchema = z
  .object({
    contractNumber: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập số hợp đồng")
      .max(50, "Số hợp đồng không quá 50 ký tự"),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    monthlyRent: z.coerce.number().min(0, "Giá thuê không được âm"),
    depositAmount: z.coerce.number().min(0, "Tiền cọc không được âm"),
    note: z.string().max(2000, "Ghi chú không quá 2000 ký tự").optional().nullable(),
  })
  .refine(
    (data) => {
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      path: ["endDate"],
    }
  );

type ContractUpdateFormValues = z.infer<typeof contractUpdateSchema>;

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { data, isLoading, error } = useContract(contractId);
  const updateContractMutation = useUpdateContract();

  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<ContractUpdateFormValues>({
    resolver: zodResolver(contractUpdateSchema),
    defaultValues: {
      contractNumber: "",
      startDate: "",
      endDate: "",
      monthlyRent: 0,
      depositAmount: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (data?.data) {
      const contract = data.data;
      reset({
        contractNumber: contract.contractNumber,
        startDate: new Date(contract.startDate).toISOString().split("T")[0],
        endDate: new Date(contract.endDate).toISOString().split("T")[0],
        monthlyRent: Number(contract.monthlyRent),
        depositAmount: Number(contract.depositAmount),
        note: contract.note || "",
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: ContractUpdateFormValues) => {
    try {
      setGlobalError(null);

      if (!isDirty || Object.keys(dirtyFields).length === 0) {
        setGlobalError("Không có trường nào thay đổi để cập nhật.");
        return;
      }

      const payload: any = {};
      if (dirtyFields.contractNumber) payload.contractNumber = formData.contractNumber;
      if (dirtyFields.startDate) payload.startDate = new Date(formData.startDate).toISOString();
      if (dirtyFields.endDate) payload.endDate = new Date(formData.endDate).toISOString();
      if (dirtyFields.monthlyRent) payload.monthlyRent = formData.monthlyRent;
      if (dirtyFields.depositAmount) payload.depositAmount = formData.depositAmount;
      if (dirtyFields.note) payload.note = formData.note;

      await updateContractMutation.mutateAsync({ id: contractId, payload });
      router.replace("/dashboard/contracts");
    } catch (error: any) {
      const errRes = error.response?.data;
      setGlobalError(errRes?.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
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
          Hợp đồng không tồn tại hoặc bạn không có quyền truy cập thông tin này.
        </p>
        <Button
          onClick={() => router.replace("/dashboard/contracts")}
          className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 h-10"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const contract = data.data;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
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
              <FileText className="h-7 w-7 text-slate-900" />
              Chỉnh sửa Hợp đồng {contract.contractNumber}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Cập nhật các điều khoản thời hạn, tiền thuê và ghi chú hợp đồng
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {globalError && (
            <div className="p-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Readonly Info Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Khu trọ
              </span>
              <p className="text-base font-bold text-slate-900">{contract.property.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Phòng trọ
              </span>
              <p className="text-base font-bold text-slate-900">
                {contract.room.name} ({contract.room.code})
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Khách thuê đứng tên
              </span>
              <p className="text-base font-bold text-slate-900">{contract.tenant.fullName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractNumber" className="text-sm font-bold text-slate-800">
              Mã Số Hợp đồng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contractNumber"
              {...register("contractNumber")}
              className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
            />
            {errors.contractNumber && (
              <p className="text-xs font-semibold text-red-600 mt-1">
                {errors.contractNumber.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-bold text-slate-800">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.startDate && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-bold text-slate-800">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.endDate && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-sm font-bold text-slate-800">
                Tiền thuê hàng tháng (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monthlyRent"
                type="number"
                {...register("monthlyRent")}
                min={0}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.monthlyRent && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.monthlyRent.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount" className="text-sm font-bold text-slate-800">
                Số tiền đặt cọc (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="depositAmount"
                type="number"
                {...register("depositAmount")}
                min={0}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.depositAmount && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.depositAmount.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-bold text-slate-800">
              Ghi chú thêm (Không bắt buộc)
            </Label>
            <textarea
              id="note"
              {...register("note")}
              rows={3}
              className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              placeholder="Thông tin ghi chú..."
            />
            {errors.note && (
              <p className="text-xs font-semibold text-red-600 mt-1">{errors.note.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateContractMutation.isPending}
              className="rounded-xl border-slate-300 text-slate-800 font-bold h-11 px-5 text-sm"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateContractMutation.isPending || !isDirty}
              className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
            >
              <Save className="h-4.5 w-4.5" />
              {updateContractMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
