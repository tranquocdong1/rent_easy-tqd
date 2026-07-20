"use client";

import { useState } from "react";
import { useContracts } from "@/hooks/use-contracts";
import { ContractStatus, ContractListItem } from "@/types/contract";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const statusMap: Record<ContractStatus, string> = {
  [ContractStatus.PENDING]: "Chờ duyệt",
  [ContractStatus.ACTIVE]: "Đang hiệu lực",
  [ContractStatus.EXPIRED]: "Đã hết hạn",
  [ContractStatus.TERMINATED]: "Đã chấm dứt",
  [ContractStatus.CANCELLED]: "Đã huỷ",
};

export default function ContractsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<ContractStatus | "ALL">("ALL");

  const { data, isLoading, isError } = useContracts({
    page,
    limit,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const meta = data?.data?.meta;
  const items: ContractListItem[] = data?.data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Hợp đồng</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Tìm kiếm theo mã, khách thuê hoặc phòng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} variant="secondary">Tìm kiếm</Button>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={status as string}
            onValueChange={(val) => {
              if (val) setStatus(val as ContractStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value={ContractStatus.PENDING}>{statusMap[ContractStatus.PENDING]}</SelectItem>
              <SelectItem value={ContractStatus.ACTIVE}>{statusMap[ContractStatus.ACTIVE]}</SelectItem>
              <SelectItem value={ContractStatus.EXPIRED}>{statusMap[ContractStatus.EXPIRED]}</SelectItem>
              <SelectItem value={ContractStatus.TERMINATED}>{statusMap[ContractStatus.TERMINATED]}</SelectItem>
              <SelectItem value={ContractStatus.CANCELLED}>{statusMap[ContractStatus.CANCELLED]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã HĐ</TableHead>
              <TableHead>Khách thuê</TableHead>
              <TableHead>Khu trọ / Phòng</TableHead>
              <TableHead>Thời hạn</TableHead>
              <TableHead className="text-right">Tiền thuê</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                  Đã có lỗi xảy ra khi tải dữ liệu.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  Không tìm thấy hợp đồng nào.
                </TableCell>
              </TableRow>
            ) : (
              items.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                  <TableCell>{contract.tenantName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{contract.roomCode}</span>
                      <span className="text-slate-500 ml-1">({contract.propertyName})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(contract.monthlyRent)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${
                          contract.status === ContractStatus.ACTIVE
                            ? "bg-green-100 text-green-800"
                            : contract.status === ContractStatus.PENDING
                            ? "bg-yellow-100 text-yellow-800"
                            : contract.status === ContractStatus.EXPIRED || contract.status === ContractStatus.TERMINATED
                            ? "bg-slate-100 text-slate-800"
                            : "bg-red-100 text-red-800"
                        }
                      `}
                    >
                      {statusMap[contract.status]}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Trang trước
          </Button>
          <div className="text-sm text-slate-500">
            Trang {meta.currentPage} / {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages || isLoading}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
