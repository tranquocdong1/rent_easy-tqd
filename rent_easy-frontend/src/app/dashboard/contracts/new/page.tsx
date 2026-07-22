"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateContract } from "@/hooks/use-contracts";
import { propertiesApi } from "@/services/api/properties";
import { roomsApi } from "@/services/api/rooms";
import { tenantsApi } from "@/services/api/tenant";
import { Property } from "@/types/property";
import { Room } from "@/types/room";
import { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePlus, ArrowLeft, PlusCircle, AlertCircle, ChevronDown, Check } from "lucide-react";

const contractSchema = z
  .object({
    propertyId: z.string().min(1, "Vui lòng chọn khu trọ"),
    roomId: z.string().min(1, "Vui lòng chọn phòng"),
    tenantId: z.string().min(1, "Vui lòng chọn khách thuê"),
    contractNumber: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập số hợp đồng")
      .max(50, "Số hợp đồng không quá 50 ký tự"),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    monthlyRent: z.coerce.number().min(0, "Giá thuê không được âm"),
    depositAmount: z.coerce.number().min(0, "Tiền cọc không được âm"),
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

type ContractFormValues = z.infer<typeof contractSchema>;

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
                Không có lựa chọn nào
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

export default function NewContractPage() {
  const router = useRouter();
  const createContractMutation = useCreateContract();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      propertyId: "",
      roomId: "",
      tenantId: "",
      contractNumber: `HD-${new Date().getTime().toString().slice(-6)}`,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      monthlyRent: 0,
      depositAmount: 0,
    },
  });

  const selectedPropertyId = watch("propertyId");
  const selectedRoomId = watch("roomId");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [propsRes, tenantsRes] = await Promise.all([
          propertiesApi.getAll({ limit: 1000 }),
          tenantsApi.getAll({ limit: 1000 }),
        ]);
        setProperties(propsRes.data.items);
        setTenants(tenantsRes.data.items);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      roomsApi
        .getAllByProperty(selectedPropertyId, { limit: 100, status: "AVAILABLE" })
        .then((res) => {
          setRooms(res.data.items);
        })
        .catch(console.error);

      setValue("roomId", "");
    } else {
      setRooms([]);
    }
  }, [selectedPropertyId, setValue]);

  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find((r) => r.id === selectedRoomId);
      if (room) {
        setValue("monthlyRent", room.rentPrice);
        setValue("depositAmount", room.deposit);
      }
    }
  }, [selectedRoomId, rooms, setValue]);

  const onSubmit = async (data: ContractFormValues) => {
    try {
      setGlobalError(null);
      const payload = {
        tenantId: data.tenantId,
        roomId: data.roomId,
        contractNumber: data.contractNumber,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
      };

      await createContractMutation.mutateAsync(payload);
      router.push("/dashboard/contracts");
    } catch (error: any) {
      const errRes = error.response?.data;
      setGlobalError(errRes?.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

  const propertyOptions = properties.map((p) => ({ label: p.name, value: p.id }));
  const roomOptions = rooms.map((r) => ({ label: `${r.name} (${r.code})`, value: r.id }));
  const tenantOptions = tenants.map((t) => ({
    label: `${t.fullName}${t.phone ? ` - ${t.phone}` : ""}`,
    value: t.id,
  }));

  if (loadingInitial) {
    return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;
  }

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
              <FilePlus className="h-7 w-7 text-slate-900" />
              Tạo Hợp đồng Mới
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Khai báo thông tin hợp đồng cho thuê trọ và ràng buộc giá thuê
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="propertyId" className="text-sm font-bold text-slate-800">
                Khu trọ / Bất động sản <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="propertyId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={propertyOptions}
                    placeholder="-- Chọn Khu Trọ --"
                  />
                )}
              />
              {errors.propertyId && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.propertyId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomId" className="text-sm font-bold text-slate-800">
                Phòng trọ trống <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="roomId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={roomOptions}
                    placeholder={
                      selectedPropertyId ? "-- Chọn Phòng Trống --" : "Vui lòng chọn Khu Trọ trước"
                    }
                    disabled={!selectedPropertyId}
                  />
                )}
              />
              {errors.roomId && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.roomId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantId" className="text-sm font-bold text-slate-800">
              Khách thuê đứng tên HĐ <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="tenantId"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={tenantOptions}
                  placeholder="-- Chọn Khách Thuê --"
                />
              )}
            />
            {errors.tenantId && (
              <p className="text-xs font-semibold text-red-600 mt-1">{errors.tenantId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractNumber" className="text-sm font-bold text-slate-800">
              Mã Số Hợp đồng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contractNumber"
              {...register("contractNumber")}
              placeholder="Ví dụ: HD-123456"
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
                Ngày bắt đầu hiệu lực <span className="text-red-500">*</span>
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
                Ngày kết thúc hợp đồng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-visible:ring-slate-400"
              />
              {errors.endDate && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {errors.endDate.message}
                </p>
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createContractMutation.isPending}
              className="rounded-xl border-slate-300 text-slate-800 font-bold h-11 px-5 text-sm"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createContractMutation.isPending}
              className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              {createContractMutation.isPending ? "Đang tạo..." : "Tạo Hợp đồng"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
