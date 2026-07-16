"use client";

import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
              Đây là trang dashboard của bạn. Hãy bắt đầu bằng việc quản lý các bất động sản của bạn.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quản lý Properties</CardTitle>
            <CardDescription>Xem và quản lý danh sách nhà trọ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Thêm mới, chỉnh sửa thông tin nhà trọ, và quản lý các phòng (rooms) bên trong mỗi nhà trọ.
            </p>
            <Button asChild>
              <Link href="/dashboard/properties">Đi tới Properties & Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
