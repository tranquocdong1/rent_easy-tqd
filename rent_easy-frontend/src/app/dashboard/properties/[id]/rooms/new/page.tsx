"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { roomsApi } from "@/services/api/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DoorOpen,
  ArrowLeft,
  Save,
  ChevronDown,
  Check,
  AlertCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

const roomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Mã phòng phải từ 3 ký tự trở lên")
    .max(50, "Mã phòng không quá 50 ký tự")
    .toUpperCase(),
  name: z
    .string()
    .trim()
    .min(3, "Tên phòng phải từ 3 ký tự trở lên")
    .max(150, "Tên phòng không quá 150 ký tự"),
  floor: z
    .number()
    .int()
    .optional()
    .or(z.nan())
    .transform((val) => (isNaN(val as number) ? undefined : val)),
  area: z
    .number({ required_error: "Vui lòng nhập diện tích" })
    .min(0.01, "Diện tích phải lớn hơn 0"),
  capacity: z
    .number({ required_error: "Vui lòng nhập sức chứa" })
    .int()
    .min(1, "Sức chứa tối thiểu là 1"),
  rentPrice: z
    .number({ required_error: "Vui lòng nhập giá thuê" })
    .min(0, "Giá thuê không được âm"),
  deposit: z
    .number({ required_error: "Vui lòng nhập giá cọc" })
    .min(0, "Giá cọc không được âm"),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
  description: z.string().trim().max(2000, "Mô tả không quá 2000 ký tự").optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

/* Custom Status Dropdown */
function RoomStatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "Phòng trống (Mặc định)", value: "AVAILABLE" },
    { label: "Bảo trì", value: "MAINTENANCE" },
    { label: "Ngừng hoạt động", value: "INACTIVE" },
  ];

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 w-full flex items-center justify-between gap-2 px-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 py-1.5 space-y-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
                  value === opt.value
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="h-4 w-4 text-slate-900 dark:text-white" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function NewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      code: "",
      name: "",
      status: "AVAILABLE",
      description: "",
    },
  });

  const selectedStatus = watch("status");

  const onSubmit = async (data: RoomFormValues) => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);
      await roomsApi.create(propertyId, data);
      toast.success("Tạo phòng mới thành công!");
      router.push(`/dashboard/properties/${propertyId}/rooms`);
      router.refresh();
    } catch (error: any) {
      if (error.response?.data?.code === "ROOM_ALREADY_EXISTS") {
        setError("code", { message: error.response.data.message });
      } else {
        const msg = error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
        setGlobalError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 h-10 px-3.5 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <DoorOpen className="h-7 w-7 text-slate-900 dark:text-slate-100" />
              Thêm Phòng Mới
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Cấu hình thông số kỹ thuật, giá thuê và sức chứa phòng trọ
            </p>
          </div>
        </div>
      </div>

      {/* 2. Form Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <Building2 className="h-5 w-5 text-slate-900 dark:text-slate-100" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Chi tiết cấu hình phòng
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {globalError && (
            <div className="p-4 text-sm font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Mã phòng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="VD: P101, A02"
                {...register("code")}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase"
              />
              {errors.code && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tên phòng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Phòng 101"
                {...register("name")}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
              {errors.name && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="floor" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tầng
              </Label>
              <Input
                id="floor"
                type="number"
                placeholder="VD: 1"
                {...register("floor", { valueAsNumber: true })}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
              {errors.floor && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.floor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Diện tích (m²) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area"
                type="number"
                step="0.01"
                placeholder="25.5"
                {...register("area", { valueAsNumber: true })}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
              {errors.area && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.area.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Sức chứa (người) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                placeholder="2"
                {...register("capacity", { valueAsNumber: true })}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
              {errors.capacity && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="rentPrice" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Giá thuê / tháng (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rentPrice"
                type="number"
                placeholder="3000000"
                {...register("rentPrice", { valueAsNumber: true })}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
              {errors.rentPrice && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.rentPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tiền đặt cọc (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deposit"
                type="number"
                placeholder="3000000"
                {...register("deposit", { valueAsNumber: true })}
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
              {errors.deposit && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.deposit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Trạng thái ban đầu
            </Label>
            <RoomStatusSelect
              value={selectedStatus}
              onChange={(val) => setValue("status", val as any)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Ghi chú thêm
            </Label>
            <textarea
              id="description"
              rows={3}
              className="flex min-h-[90px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              placeholder="Ghi chú về nội thất, tiện ích phòng..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs font-semibold text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold h-11 px-5 text-sm"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold h-11 px-6 text-sm gap-2 shadow-2xs"
            >
              <Save className="h-4.5 w-4.5" />
              {isSubmitting ? "Đang lưu..." : "Lưu Phòng Mới"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
