"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTenantFormValues, createTenantSchema } from "../schemas/tenant-schema";
import { tenantsApi } from "@/services/api/tenant";
import { Gender } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ArrowLeft, AlertCircle, ChevronDown, Check } from "lucide-react";

const GENDER_OPTIONS = [
  { label: "Nam", value: Gender.MALE },
  { label: "Nữ", value: Gender.FEMALE },
  { label: "Khác", value: Gender.OTHER },
];

/* Custom Popover Select Component */
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
}: {
  value?: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 transition-colors shadow-2xs hover:border-slate-300"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
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

export default function NewTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      fullName: "",
      identityNumber: "",
      gender: undefined,
      dateOfBirth: "",
      identityIssuedDate: "",
      identityIssuedPlace: "",
      phone: "",
      email: "",
      permanentAddress: "",
      note: "",
    },
  });

  const onSubmit = async (data: CreateTenantFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        phone: data.phone || null,
        email: data.email || null,
        dateOfBirth: data.dateOfBirth || null,
        identityIssuedDate: data.identityIssuedDate || null,
        identityIssuedPlace: data.identityIssuedPlace || null,
        permanentAddress: data.permanentAddress || null,
        note: data.note || null,
      };

      await tenantsApi.create(payload);
      router.push("/dashboard/tenants");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi tạo người thuê");
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
              <UserPlus className="h-7 w-7 text-slate-900" />
              Thêm mới Khách thuê
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Nhập thông tin chi tiết định danh và liên hệ của người thuê trọ
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-bold text-slate-800">
                Họ và tên khách thuê <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.fullName && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="identityNumber" className="text-sm font-bold text-slate-800">
                Số CCCD / CMND <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identityNumber"
                {...register("identityNumber")}
                placeholder="079095001234"
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.identityNumber && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.identityNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-bold text-slate-800">
                Giới tính
              </Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={GENDER_OPTIONS}
                    placeholder="Chọn giới tính"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-bold text-slate-800">
                Ngày sinh
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold text-slate-800">
                Số điện thoại liên hệ
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="0901234567"
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.phone && (
                <p className="text-xs font-semibold text-red-600 mt-1 font-semibold">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-800">
                Địa chỉ Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="nguyenvana@example.com"
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.email && (
                <p className="text-xs font-semibold text-red-600 mt-1 font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="identityIssuedDate" className="text-sm font-bold text-slate-800">
                Ngày cấp CCCD
              </Label>
              <Input
                id="identityIssuedDate"
                type="date"
                {...register("identityIssuedDate")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identityIssuedPlace" className="text-sm font-bold text-slate-800">
                Nơi cấp CCCD
              </Label>
              <Input
                id="identityIssuedPlace"
                {...register("identityIssuedPlace")}
                placeholder="Cục CS QLHC về trật tự xã hội..."
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permanentAddress" className="text-sm font-bold text-slate-800">
              Địa chỉ thường trú / Nguyên quán
            </Label>
            <Input
              id="permanentAddress"
              {...register("permanentAddress")}
              placeholder="Nhập địa chỉ đăng ký hộ khẩu thường trú đầy đủ..."
              className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
            />
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
              placeholder="Thông tin ghi chú thêm về khách thuê..."
            />
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
              <UserPlus className="h-4.5 w-4.5" />
              {isSubmitting ? "Đang lưu..." : "Lưu Khách thuê"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
