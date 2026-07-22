"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { propertiesApi } from "@/services/api/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, PlusCircle, AlertCircle, ChevronDown, Check } from "lucide-react";

const propertySchema = z.object({
  name: z.string().trim().min(3, "Tên phải từ 3 ký tự trở lên").max(150, "Tên không quá 150 ký tự"),
  propertyType: z.enum(["HOUSE", "BOARDING_HOUSE", "MINI_APARTMENT", "OTHER"], {
    required_error: "Vui lòng chọn loại hình",
  }),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ").max(500, "Địa chỉ không quá 500 ký tự"),
  description: z.string().trim().max(2000, "Mô tả không quá 2000 ký tự").optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const PROPERTY_TYPE_OPTIONS = [
  { label: "Nhà nguyên căn", value: "HOUSE" },
  { label: "Dãy trọ", value: "BOARDING_HOUSE" },
  { label: "Chung cư mini", value: "MINI_APARTMENT" },
  { label: "Khác", value: "OTHER" },
];

const STATUS_OPTIONS = [
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Ngừng hoạt động", value: "INACTIVE" },
];

/* Custom Popover Select Component */
function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 transition-colors shadow-2xs hover:border-slate-300"
      >
        <span>{selectedOption ? selectedOption.label : "Chọn..."}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5 max-h-60 overflow-y-auto">
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

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      propertyType: "HOUSE",
      status: "ACTIVE",
      address: "",
      description: "",
    },
  });

  const onSubmit = async (data: PropertyFormValues) => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);
      await propertiesApi.create({
        ...data,
        description: data.description || undefined,
      });
      router.replace("/dashboard/properties");
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === "PROPERTY_ALREADY_EXISTS") {
        setError("name", { type: "manual", message: errRes.message });
      } else {
        setGlobalError(errRes?.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Building2 className="h-7 w-7 text-slate-900" />
              Thêm mới Bất động sản
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Khai báo thông tin nhà trọ mới để đưa vào hệ thống quản lý vận hành
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

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-slate-800">
              Tên Bất động sản / Nhà trọ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ví dụ: Nhà trọ Nguyễn Trãi, Căn hộ dịch vụ Dãy A..."
              className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
            />
            {errors.name && (
              <p className="text-xs font-semibold text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="propertyType" className="text-sm font-bold text-slate-800">
                Loại hình bất động sản <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={PROPERTY_TYPE_OPTIONS}
                  />
                )}
              />
              {errors.propertyType && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.propertyType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-bold text-slate-800">
                Trạng thái khai thác <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={STATUS_OPTIONS}
                  />
                )}
              />
              {errors.status && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-bold text-slate-800">
              Địa chỉ đầy đủ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Nhập địa chỉ nhà trọ (Số nhà, Tên đường, Phường/Xã, Quận/Huyện...)"
              className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
            />
            {errors.address && (
              <p className="text-xs font-semibold text-red-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-slate-800">
              Mô tả chi tiết / Ghi chú (Không bắt buộc)
            </Label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              placeholder="Nhập ghi chú thêm về tòa nhà, quy định chung hoặc tiện ích..."
            />
            {errors.description && (
              <p className="text-xs font-semibold text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 text-slate-800 font-bold h-11 px-5 text-sm"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              {isSubmitting ? "Đang lưu..." : "Lưu Bất động sản"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
