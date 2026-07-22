"use client";

import { useState } from "react";
import { useContracts, useDeleteContract, useActivateContract, useTerminateContract } from "@/hooks/use-contracts";
import { ContractStatus, ContractListItem } from "@/types/contract";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  Power,
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const statusMap: Record<ContractStatus, string> = {
  [ContractStatus.PENDING]: "Chờ duyệt",
  [ContractStatus.ACTIVE]: "Đang hiệu lực",
  [ContractStatus.EXPIRED]: "Đã hết hạn",
  [ContractStatus.TERMINATED]: "Đã chấm dứt",
  [ContractStatus.CANCELLED]: "Đã huỷ",
};

/* Custom Sleek Dropdown Select Component */
function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "Tất cả trạng thái", value: "ALL" },
    { label: "Đang hiệu lực", value: ContractStatus.ACTIVE },
    { label: "Chờ duyệt", value: ContractStatus.PENDING },
    { label: "Đã hết hạn", value: ContractStatus.EXPIRED },
    { label: "Đã chấm dứt", value: ContractStatus.TERMINATED },
    { label: "Đã huỷ", value: ContractStatus.CANCELLED },
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-none transition-colors"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  value === option.value
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 text-slate-900" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ContractsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContractStatus | "ALL">("ALL");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteContract();

  const [activateId, setActivateId] = useState<string | null>(null);
  const activateMutation = useActivateContract();

  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [terminateDate, setTerminateDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [terminateReason, setTerminateReason] = useState("");
  const terminateMutation = useTerminateContract();

  const { data, isLoading, isError, isFetching } = useContracts({
    page,
    limit,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Xóa hợp đồng thành công");
      setDeleteId(null);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error("Không thể xoá hợp đồng vì đang được sử dụng.");
      } else {
        toast.error("Đã xảy ra lỗi khi xoá hợp đồng.");
      }
      setDeleteId(null);
    }
  };

  const handleActivate = async () => {
    if (!activateId) return;
    try {
      await activateMutation.mutateAsync(activateId);
      toast.success("Kích hoạt hợp đồng thành công");
      setActivateId(null);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error(error.response.data?.message || "Không thể kích hoạt hợp đồng.");
      } else {
        toast.error("Đã xảy ra lỗi khi kích hoạt hợp đồng.");
      }
      setActivateId(null);
    }
  };

  const handleTerminate = async () => {
    if (!terminateId) return;
    try {
      await terminateMutation.mutateAsync({
        id: terminateId,
        payload: { terminatedDate: terminateDate, reason: terminateReason },
      });
      toast.success("Chấm dứt hợp đồng thành công");
      setTerminateId(null);
      setTerminateDate(format(new Date(), "yyyy-MM-dd"));
      setTerminateReason("");
    } catch (error: any) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Đã xảy ra lỗi khi chấm dứt hợp đồng.");
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
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
  const activeContractsCount = items.filter((c) => c.status === ContractStatus.ACTIVE).length;
  const pendingContractsCount = items.filter(
    (c) => c.status === ContractStatus.PENDING || c.status === ContractStatus.EXPIRED
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Quản lý Hợp đồng
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Hợp đồng thuê trọ
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Theo dõi danh sách hợp đồng, thời hạn pháp lý và trạng thái cho thuê
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="self-start sm:self-auto rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-11 px-5 gap-2 shadow-xs"
        >
          <Link href="/dashboard/contracts/new">
            <PlusCircle className="h-5 w-5" />
            Thêm Hợp đồng mới
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Grid: 3 Stat Cards with Fixed Height */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Tổng số Hợp đồng */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số Hợp đồng
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {isLoading && !data ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {meta?.totalItems ?? items.length}
                  </span>
                  <span className="text-base font-semibold text-slate-500">hợp đồng</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Tổng số trong danh sách</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Đang hiệu lực */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đang hiệu lực
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {isLoading && !data ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {activeContractsCount}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Hợp đồng đang vận hành</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Chờ duyệt / Hết hạn */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors min-h-[148px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chờ duyệt / Hết hạn
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="min-h-[64px] flex flex-col justify-end">
            {isLoading && !data ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900">
                    {pendingContractsCount}
                  </span>
                  <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                    Cần xử lý
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5">Cần duyệt hoặc gia hạn</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Data Card: Toolbar + Table + Pagination */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo mã HĐ, khách thuê..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <StatusSelect
              value={status}
              onChange={(val) => {
                setStatus(val as ContractStatus | "ALL");
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Contracts Table View */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left table-fixed min-w-[850px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                <th className="w-[15%] pb-4 pr-4 whitespace-nowrap">Mã Hợp đồng</th>
                <th className="w-[18%] pb-4 px-3 whitespace-nowrap">Khách thuê</th>
                <th className="w-[22%] pb-4 px-3 whitespace-nowrap">Khu trọ / Phòng</th>
                <th className="w-[18%] pb-4 px-3 whitespace-nowrap">Thời hạn</th>
                <th className="w-[12%] pb-4 px-3 text-right whitespace-nowrap">Tiền thuê</th>
                <th className="w-[15%] pb-4 px-3 whitespace-nowrap">Trạng thái</th>
                <th className="w-[15%] pb-4 pl-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 transition-opacity duration-200 ${
                isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 pr-4"><Skeleton className="h-6 w-3/4 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-28 rounded-lg" /></td>
                    <td className="py-4 px-3 text-right"><Skeleton className="h-6 w-20 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-3"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="py-4 pl-3 text-right"><Skeleton className="h-6 w-24 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-red-600">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="h-10 w-10 text-red-400" />
                      <p className="font-bold text-base">Đã có lỗi xảy ra khi tải dữ liệu hợp đồng</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-800 text-base">Không tìm thấy hợp đồng</p>
                      <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="font-bold text-slate-900 group-hover:text-black transition-colors text-base block truncate hover:underline"
                      >
                        {contract.contractNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-3 font-semibold text-slate-800 text-sm truncate">
                      {contract.tenantName}
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {contract.roomCode}
                        <span className="text-slate-500 font-normal text-xs ml-1.5">
                          ({contract.propertyName})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </td>
                    <td className="py-4 px-3 text-right font-extrabold text-slate-900 text-sm whitespace-nowrap">
                      {formatCurrency(contract.monthlyRent)}
                    </td>
                    <td className="py-4 px-3">
                      {contract.status === ContractStatus.ACTIVE ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-xs whitespace-nowrap">
                          Đang hiệu lực
                        </span>
                      ) : contract.status === ContractStatus.PENDING ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold text-xs whitespace-nowrap">
                          Chờ duyệt
                        </span>
                      ) : contract.status === ContractStatus.EXPIRED ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold text-xs whitespace-nowrap">
                          Đã hết hạn
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200/80 font-semibold text-xs whitespace-nowrap">
                          {statusMap[contract.status]}
                        </span>
                      )}
                    </td>
                    <td className="py-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {contract.status === ContractStatus.PENDING && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActivateId(contract.id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
                          >
                            <Power className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Kích hoạt
                          </Button>
                        )}
                        {contract.status === ContractStatus.ACTIVE && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTerminateId(contract.id);
                              setTerminateDate(format(new Date(), "yyyy-MM-dd"));
                              setTerminateReason("");
                            }}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50 whitespace-nowrap"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1 text-amber-700" />
                            Chấm dứt
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
                        >
                          <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(contract.id)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-slate-600">
            <div>
              Trang {meta.currentPage} / {meta.totalPages} (Tổng số {meta.totalItems} hợp đồng)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="rounded-xl border-slate-300 text-slate-900 font-bold h-9 px-3 text-xs gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages || isLoading}
                className="rounded-xl border-slate-300 text-slate-900 font-bold h-9 px-3 text-xs gap-1"
              >
                Tiếp
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Xác nhận xoá Hợp đồng
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2">
              Bạn có chắc chắn muốn xoá hợp đồng này? Hành động này sẽ lưu vết xóa mềm trên hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteId(null)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Alert Dialog */}
      <AlertDialog open={!!activateId} onOpenChange={(open) => !open && setActivateId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Power className="h-5 w-5 text-emerald-600" />
              Kích hoạt Hợp đồng
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2 space-y-1">
              <span>Bạn có chắc chắn muốn kích hoạt hợp đồng này?</span>
              <ul className="list-disc pl-5 pt-2 text-xs font-semibold text-slate-700 space-y-1">
                <li>Hợp đồng sẽ chuyển sang <b>Đang hiệu lực (ACTIVE)</b></li>
                <li>Trạng thái phòng sẽ chuyển sang <b>Đang thuê (OCCUPIED)</b></li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2">
            <AlertDialogCancel
              disabled={activateMutation.isPending}
              onClick={() => setActivateId(null)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleActivate();
              }}
              disabled={activateMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {activateMutation.isPending ? "Đang kích hoạt..." : "Kích hoạt hợp đồng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate Confirmation Alert Dialog */}
      <AlertDialog open={!!terminateId} onOpenChange={(open) => !open && setTerminateId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-600" />
              Chấm dứt Hợp đồng sớm
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500 font-medium">
              Chấm dứt hợp đồng sớm trước thời hạn pháp lý. Trạng thái phòng sẽ được trả về Còn trống (AVAILABLE).
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Ngày chấm dứt *</label>
              <Input
                type="date"
                value={terminateDate}
                onChange={(e) => setTerminateDate(e.target.value)}
                disabled={terminateMutation.isPending}
                className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Lý do chấm dứt</label>
              <textarea
                rows={3}
                className="flex w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                placeholder="Nhập lý do kết thúc hợp đồng..."
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                disabled={terminateMutation.isPending}
              />
            </div>
          </div>
          <AlertDialogFooter className="mt-2 flex items-center gap-2">
            <AlertDialogCancel
              disabled={terminateMutation.isPending}
              onClick={() => setTerminateId(null)}
              className="rounded-xl border-slate-300 text-slate-700 font-semibold"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleTerminate();
              }}
              disabled={terminateMutation.isPending || !terminateDate}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {terminateMutation.isPending ? "Đang chấm dứt..." : "Chấm dứt hợp đồng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
