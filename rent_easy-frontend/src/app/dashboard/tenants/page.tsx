"use client";

import { useEffect, useState } from "react";
import { tenantsApi } from "@/services/api/tenant";
import { Tenant, TenantQuery } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import Link from "next/link";
import { formatGender } from "@/lib/utils";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<TenantQuery>({ page: 1, limit: 10 });
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenants = async (currentQuery: TenantQuery) => {
    try {
      setLoading(true);
      setError(null);
      const response = await tenantsApi.getAll(currentQuery);
      // Assuming response matches { data: { items: [], meta: {} } }
      // We need to type cast or adapt if the API structure has an extra wrapper
      const items = (response.data as any).items || [];
      setTenants(items);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách người thuê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(query);
  }, [query]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery({ ...query, search: e.target.value, page: 1 });
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);
    try {
      await tenantsApi.remove(tenantToDelete);
      setTenantToDelete(null);
      fetchTenants(query);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể xóa người thuê");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách người thuê</h1>
        <Link href="/dashboard/tenants/new">
          <Button>Thêm người thuê</Button>
        </Link>
      </div>

      <div className="flex items-center mb-4">
        <Input
          placeholder="Tìm kiếm theo tên, CCCD, SĐT..."
          className="max-w-sm"
          value={query.search || ""}
          onChange={handleSearch}
        />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Họ tên</th>
              <th scope="col" className="px-6 py-3">CCCD</th>
              <th scope="col" className="px-6 py-3">Số điện thoại</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Giới tính</th>
              <th scope="col" className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Đang tải...</td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Không có dữ liệu</td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {tenant.fullName}
                  </td>
                  <td className="px-6 py-4">{tenant.identityNumber}</td>
                  <td className="px-6 py-4">{tenant.phone || "-"}</td>
                  <td className="px-6 py-4">{tenant.email || "-"}</td>
                  <td className="px-6 py-4">{formatGender(tenant.gender)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/dashboard/tenants/${tenant.id}/edit`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                      Sửa
                    </Link>
                    <button 
                      onClick={() => setTenantToDelete(tenant.id)} 
                      className="font-medium text-red-600 dark:text-red-500 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa người thuê. Thông tin người thuê sẽ không còn hiển thị trên hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setTenantToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isDeleting} 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Đang xóa..." : "Xóa người thuê"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
