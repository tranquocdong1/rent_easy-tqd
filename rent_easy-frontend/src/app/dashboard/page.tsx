"use client";

import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Tổng quan
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Xin chào, {user?.fullName || 'Người dùng'}!</CardTitle>
            <CardDescription>Chào mừng bạn quay trở lại Rent Easy.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Đây là trang dashboard của bạn. Hiện tại hệ thống đang được phát triển, các tính năng quản lý nhà trọ sẽ sớm được cập nhật tại đây.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
