"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { tenantsApi } from "@/services/api/tenant";
import { TenantDetail } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantContracts } from "./components/tenant-contracts";
import { TenantInvoices } from "./components/tenant-invoices";
import { formatGender } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Edit, User, Phone, Mail, CreditCard, Home, Clock } from "lucide-react";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "contracts" | "payments">("info");

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const res = await tenantsApi.getById(tenantId);
        setTenant(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("TENANT_NOT_FOUND");
        } else {
          setError(err.response?.data?.message || "Không thể tải dữ liệu người thuê");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (tenantId) fetchTenant();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
        <div className="h-8 w-32 bg-slate-200 animate-pulse rounded"></div>
        <div className="h-32 w-full bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded"></div>
        <div className="h-64 w-full bg-slate-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error === "TENANT_NOT_FOUND" || !tenant) {
    return (
      <div className="container mx-auto py-16 px-4 text-center max-w-lg">
        <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-lg shadow-sm">
          <User className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy người thuê</h2>
          <p className="text-slate-500 mb-6">Người thuê này có thể đã bị xóa hoặc không tồn tại.</p>
          <Button onClick={() => router.push("/dashboard/tenants")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const initials = tenant.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/tenants")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết người thuê</h1>
        </div>
        <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
          <Button className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Sửa thông tin
          </Button>
        </Link>
      </div>

      {/* Hero Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{tenant.fullName}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>{tenant.identityNumber}</span>
                </div>
                {tenant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{tenant.phone}</span>
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{tenant.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="flex gap-4 mt-4 md:mt-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-slate-200">
              <div 
                className="text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                onClick={() => setActiveTab("contracts")}
              >
                <div className="text-2xl font-bold text-primary">{tenant.statistics?.activeContracts || 0}</div>
                <div className="text-xs text-slate-500">Hợp đồng đang thuê</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                onClick={() => setActiveTab("payments")}
              >
                <div className="text-2xl font-bold text-red-500">{tenant.paymentStats?.unpaidInvoices || 0}</div>
                <div className="text-xs text-slate-500">Hóa đơn chưa thanh toán</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "info"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("info")}
        >
          Thông tin cá nhân
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "contracts"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("contracts")}
        >
          Hợp đồng & Phòng
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "payments"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("payments")}
        >
          Lịch sử thanh toán
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết định danh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-500">Giới tính</div>
                  <div className="font-medium">{formatGender(tenant.gender)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Ngày sinh</div>
                  <div className="font-medium">
                    {tenant.dateOfBirth ? new Date(tenant.dateOfBirth).toLocaleDateString("vi-VN") : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">CCCD/CMND</div>
                  <div className="font-medium">{tenant.identityNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Ngày cấp</div>
                  <div className="font-medium">
                    {tenant.identityIssuedDate ? new Date(tenant.identityIssuedDate).toLocaleDateString("vi-VN") : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Nơi cấp</div>
                  <div className="font-medium">{tenant.identityIssuedPlace || "-"}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin liên hệ & Khác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-500">Địa chỉ thường trú</div>
                  <div className="font-medium">{tenant.permanentAddress || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Số điện thoại</div>
                  <div className="font-medium">{tenant.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="font-medium">{tenant.email || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Ghi chú</div>
                  <div className="font-medium whitespace-pre-wrap">{tenant.note || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Ngày tạo hồ sơ</div>
                  <div className="font-medium">
                    {new Date(tenant.createdAt).toLocaleDateString("vi-VN")} lúc {new Date(tenant.createdAt).toLocaleTimeString("vi-VN")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "contracts" && (
          <TenantContracts tenantId={tenant.id} />
        )}

        {activeTab === "payments" && (
          <TenantInvoices tenantId={tenant.id} />
        )}
      </div>
    </div>
  );
}
