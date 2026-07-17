"use client";

import { useEffect, useState } from "react";
import { tenantsApi } from "@/services/api/tenant";
import { Tenant, TenantQuery } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<TenantQuery>({ page: 1, limit: 10 });

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách người thuê</h1>
        <Button>Thêm người thuê (Tính năng 2)</Button>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">Đang tải...</td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">Không có dữ liệu</td>
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
                  <td className="px-6 py-4">{tenant.gender || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
