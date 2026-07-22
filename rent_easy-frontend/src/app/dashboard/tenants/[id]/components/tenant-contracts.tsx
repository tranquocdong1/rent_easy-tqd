"use client";

import { useEffect, useState } from "react";
import { contractsApi } from "@/services/api/contract";
import { ContractListItem, ContractStatus } from "@/types/contract";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const statusMap: Record<ContractStatus, { label: string; color: string }> = {
  [ContractStatus.PENDING]: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
  [ContractStatus.ACTIVE]: { label: 'Đang thuê', color: 'bg-green-100 text-green-800' },
  [ContractStatus.EXPIRED]: { label: 'Hết hạn', color: 'bg-red-100 text-red-800' },
  [ContractStatus.TERMINATED]: { label: 'Đã chấm dứt', color: 'bg-gray-100 text-gray-800' },
  [ContractStatus.CANCELLED]: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
};

export function TenantContracts({ tenantId }: { tenantId: string }) {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const res = await contractsApi.getContracts({ tenantId, limit: 100 });
        setContracts(res.data.items);
      } catch (err: any) {
        setError("Không thể tải danh sách hợp đồng");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [tenantId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (contracts.length === 0) {
    return <div className="p-8 text-center text-slate-500">Chưa có hợp đồng nào.</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã HĐ</TableHead>
              <TableHead>Khu trọ / Phòng</TableHead>
              <TableHead>Thời hạn</TableHead>
              <TableHead>Giá thuê</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                <TableCell>
                  <div className="font-medium">{contract.roomCode}</div>
                  <div className="text-xs text-slate-500">{contract.propertyName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(contract.startDate).toLocaleDateString("vi-VN")} - {new Date(contract.endDate).toLocaleDateString("vi-VN")}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(contract.monthlyRent)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusMap[contract.status].color}>
                    {statusMap[contract.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
