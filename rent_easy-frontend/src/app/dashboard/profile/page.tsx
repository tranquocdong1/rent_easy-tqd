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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, { message: "Mật khẩu cũ phải có ít nhất 6 ký tự" }),
  newPassword: z.string().min(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, setAuth, accessToken, clearAuth } = useAuthStore();
  const router = useRouter();
  
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      
      // Update local store
      if (accessToken && user) {
        setAuth(accessToken, { ...user, fullName: res.data.fullName });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setPasswordMessage(null);
    try {
      await api.patch("/v1/users/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công! Bạn sẽ phải đăng nhập lại.' });
      resetPassword();
      
      // Since all sessions are revoked, redirect to login after a delay
      setTimeout(() => {
        clearAuth();
        router.push("/login");
      }, 3000);
      
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Hồ sơ cá nhân
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {profileMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {profileMessage.text}
            </div>
          )}
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Không thể thay đổi)</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-slate-50" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input id="fullName" {...registerProfile("fullName")} />
              {profileErrors.fullName && (
                <p className="text-xs text-red-500">{profileErrors.fullName.message}</p>
              )}
            </div>
            
            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>Đảm bảo tài khoản của bạn đang sử dụng một mật khẩu an toàn</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {passwordMessage.text}
            </div>
          )}
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
              <Input id="oldPassword" type="password" {...registerPassword("oldPassword")} />
              {passwordErrors.oldPassword && (
                <p className="text-xs text-red-500">{passwordErrors.oldPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input id="newPassword" type="password" {...registerPassword("newPassword")} />
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input id="confirmPassword" type="password" {...registerPassword("confirmPassword")} />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button type="submit" variant="secondary" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
