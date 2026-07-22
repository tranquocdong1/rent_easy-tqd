"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Lock,
  Save,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, { message: "Mật khẩu cũ phải có ít nhất 6 ký tự" }),
    newPassword: z.string().min(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setProfileMessage(null);
    try {
      const res = await api.patch("/v1/users/me", data);
      toast.success("Cập nhật thông tin tài khoản thành công!");
      setProfileMessage({ type: "success", text: "Cập nhật thông tin tài khoản thành công!" });

      if (user) {
        setAuth({ ...user, fullName: res.data.fullName });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ";
      toast.error(msg);
      setProfileMessage({ type: "error", text: msg });
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setPasswordMessage(null);
    try {
      await api.patch("/v1/users/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      toast.success("Đổi mật khẩu thành công! Hệ thống sẽ yêu cầu đăng nhập lại.");
      setPasswordMessage({
        type: "success",
        text: "Đổi mật khẩu thành công! Bạn sẽ được chuyển hướng đăng nhập lại trong vài giây...",
      });
      resetPassword();

      setTimeout(() => {
        clearAuth();
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra khi cập nhật mật khẩu";
      toast.error(msg);
      setPasswordMessage({ type: "error", text: msg });
    }
  };

  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Cài đặt Tài khoản & Hồ sơ
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Thiết lập cá nhân
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Quản lý thông tin tài khoản quản trị, mật khẩu bảo mật và quyền hạn vận hành
          </p>
        </div>
      </div>

      {/* 2. User Overview Hero Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-md shrink-0">
          {userInitial}
        </div>
        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900">{user?.fullName || "Người dùng"}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Quản trị viên
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500">{user?.email}</p>
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Tài khoản hoạt động bình thường
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Settings Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Card 1: Basic Profile Settings */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/60">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h2>
              <p className="text-xs text-slate-500 font-medium">
                Cập nhật thông tin hiển thị trên toàn hệ thống Rent Easy
              </p>
            </div>
          </div>

          {profileMessage && (
            <div
              className={`p-4 text-sm font-semibold rounded-xl border flex items-center gap-2 ${
                profileMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {profileMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-800">
                Địa chỉ Email (Không thể thay đổi)
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="h-11 bg-slate-100 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-bold text-slate-800">
                Họ và tên hiển thị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                {...registerProfile("fullName")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
              />
              {profileErrors.fullName && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {profileErrors.fullName.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmittingProfile}
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
              >
                <Save className="h-4.5 w-4.5" />
                {isSubmittingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </div>

        {/* Card 2: Security & Password Settings */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/60">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Đổi mật khẩu bảo mật</h2>
              <p className="text-xs text-slate-500 font-medium">
                Đảm bảo tài khoản quản trị của bạn sử dụng mật khẩu có độ bảo mật cao
              </p>
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`p-4 text-sm font-semibold rounded-xl border flex items-center gap-2 ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-sm font-bold text-slate-800">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="oldPassword"
                type="password"
                {...registerPassword("oldPassword")}
                className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
              />
              {passwordErrors.oldPassword && (
                <p className="text-xs font-semibold text-red-600 mt-1">
                  {passwordErrors.oldPassword.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-bold text-slate-800">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword")}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-800">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword("confirmPassword")}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus-visible:ring-slate-400"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmittingPassword}
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold h-11 px-6 text-sm gap-2 shadow-xs"
              >
                <KeyRound className="h-4.5 w-4.5" />
                {isSubmittingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
