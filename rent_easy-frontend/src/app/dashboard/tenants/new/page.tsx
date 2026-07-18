"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTenantFormValues, createTenantSchema } from "../schemas/tenant-schema";
import { tenantsApi } from "@/services/api/tenant";
import { Gender } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
      // transform empty strings to null for optional fields before sending to API
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
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Thêm Người Thuê Mới</h1>
        <p className="text-gray-500">Nhập thông tin chi tiết của người thuê</p>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên *</Label>
            <Input id="fullName" {...register("fullName")} placeholder="Nguyễn Văn A" />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="identityNumber">CCCD/CMND *</Label>
            <Input id="identityNumber" {...register("identityNumber")} placeholder="079095001234" />
            {errors.identityNumber && <p className="text-sm text-red-500">{errors.identityNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <select
              id="gender"
              {...register("gender")}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Chọn giới tính</option>
              <option value={Gender.MALE}>Nam</option>
              <option value={Gender.FEMALE}>Nữ</option>
              <option value={Gender.OTHER}>Khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" {...register("phone")} placeholder="0901234567" />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="nguyenvana@example.com" />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="identityIssuedDate">Ngày cấp CCCD</Label>
            <Input id="identityIssuedDate" type="date" {...register("identityIssuedDate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="identityIssuedPlace">Nơi cấp CCCD</Label>
            <Input id="identityIssuedPlace" {...register("identityIssuedPlace")} placeholder="Cục CS QLHC..." />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="permanentAddress">Địa chỉ thường trú</Label>
          <Input id="permanentAddress" {...register("permanentAddress")} placeholder="123 Đường ABC..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Ghi chú</Label>
          <textarea
            id="note"
            {...register("note")}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Thông tin thêm..."
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu Người Thuê"}
          </Button>
        </div>
      </form>
    </div>
  );
}
