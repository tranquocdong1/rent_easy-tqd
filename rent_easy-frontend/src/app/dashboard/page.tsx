"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { propertiesApi } from "@/services/api/properties";
import { contractsApi } from "@/services/api/contract";
import { getInvoices } from "@/services/api/invoices";
import { ContractListItem, ContractStatus } from "@/types/contract";
import { Invoice } from "@/types/invoice";
import { PropertyDetail } from "@/types/property";
import { formatPropertyType } from "@/lib/utils";
import {
  BarChart3,
  Home,
  DollarSign,
  Calendar,
  Building2,
  PlusCircle,
  FilePlus,
  Receipt,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  DoorOpen,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  // Core Stats
  const [totalProperties, setTotalProperties] = useState<number | null>(null);
  const [activeLeasesCount, setActiveLeasesCount] = useState<number | null>(null);
  const [loadingCoreStats, setLoadingCoreStats] = useState(true);
  const [errorCoreStats, setErrorCoreStats] = useState(false);

  // Room Status Stats & Properties List
  const [propertiesList, setPropertiesList] = useState<PropertyDetail[]>([]);
  const [vacantRooms, setVacantRooms] = useState<number | null>(null);
  const [occupiedRooms, setOccupiedRooms] = useState<number | null>(null);
  const [loadingRoomStats, setLoadingRoomStats] = useState(true);
  const [errorRoomStats, setErrorRoomStats] = useState(false);

  // Financial Stats
  const [totalPaidRevenue, setTotalPaidRevenue] = useState<number | null>(null);
  const [totalUnpaidRevenue, setTotalUnpaidRevenue] = useState<number | null>(null);
  const [loadingFinancialStats, setLoadingFinancialStats] = useState(true);
  const [errorFinancialStats, setErrorFinancialStats] = useState(false);

  // Expiring Contracts Stats
  const [expiringContracts, setExpiringContracts] = useState<ContractListItem[]>([]);
  const [loadingExpiringContracts, setLoadingExpiringContracts] = useState(true);
  const [errorExpiringContracts, setErrorExpiringContracts] = useState(false);

  const isAnyLoading =
    loadingCoreStats || loadingRoomStats || loadingFinancialStats || loadingExpiringContracts;

  const fetchDashboardData = async () => {
    // 1. Fetch Core Stats (Total properties & Active Leases)
    setLoadingCoreStats(true);
    setErrorCoreStats(false);
    try {
      const [propRes, contractRes] = await Promise.all([
        propertiesApi.getAll({ limit: 1 }),
        contractsApi.getContracts({ limit: 1, status: ContractStatus.ACTIVE }),
      ]);

      setTotalProperties(propRes?.data?.meta?.totalItems ?? 0);
      setActiveLeasesCount(contractRes?.data?.meta?.totalItems ?? 0);
    } catch (err) {
      console.error("Failed to fetch core stats", err);
      setErrorCoreStats(true);
    } finally {
      setLoadingCoreStats(false);
    }

    // 2. Fetch Room Status & Property Detailed List
    setLoadingRoomStats(true);
    setErrorRoomStats(false);
    try {
      const propsList = await propertiesApi.getAll({ limit: 50 });
      const items = propsList?.data?.items ?? [];

      if (items.length === 0) {
        setVacantRooms(0);
        setOccupiedRooms(0);
        setPropertiesList([]);
      } else {
        const propDetails = await Promise.all(
          items.map((p) => propertiesApi.getById(p.id).catch(() => null))
        );

        const validDetails: PropertyDetail[] = [];
        let totalVacant = 0;
        let totalOccupied = 0;

        propDetails.forEach((detail) => {
          if (detail?.data) {
            const prop = detail.data;
            validDetails.push(prop);
            totalVacant += prop.statistics?.availableRooms ?? 0;
            totalOccupied += prop.statistics?.occupiedRooms ?? 0;
          }
        });

        setPropertiesList(validDetails);
        setVacantRooms(totalVacant);
        setOccupiedRooms(totalOccupied);
      }
    } catch (err) {
      console.error("Failed to fetch room status", err);
      setErrorRoomStats(true);
    } finally {
      setLoadingRoomStats(false);
    }

    // 3. Fetch Financial Statistics (Invoices)
    setLoadingFinancialStats(true);
    setErrorFinancialStats(false);
    try {
      const invoicesRes = await getInvoices({ limit: 100 });
      const invoices: Invoice[] = invoicesRes?.data?.items ?? [];

      let paidSum = 0;
      let unpaidSum = 0;

      invoices.forEach((inv) => {
        const paid = Number(inv.paidAmount) || 0;
        const total = Number(inv.totalAmount) || 0;
        paidSum += paid;
        if (total > paid) {
          unpaidSum += total - paid;
        }
      });

      setTotalPaidRevenue(paidSum);
      setTotalUnpaidRevenue(unpaidSum);
    } catch (err) {
      console.error("Failed to fetch financial stats", err);
      setErrorFinancialStats(true);
    } finally {
      setLoadingFinancialStats(false);
    }

    // 4. Fetch Expiring Contracts (ACTIVE & endDate <= today + 30 days)
    setLoadingExpiringContracts(true);
    setErrorExpiringContracts(false);
    try {
      const contractsRes = await contractsApi.getContracts({
        limit: 50,
        status: ContractStatus.ACTIVE,
      });

      const contractsList: ContractListItem[] = contractsRes?.data?.items ?? [];
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);

      const expiring = contractsList.filter((c) => {
        if (!c.endDate) return false;
        const endDate = new Date(c.endDate);
        return endDate >= now && endDate <= in30Days;
      });

      setExpiringContracts(expiring.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch expiring contracts", err);
      setErrorExpiringContracts(true);
    } finally {
      setLoadingExpiringContracts(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const totalRoomsCount = (vacantRooms ?? 0) + (occupiedRooms ?? 0);
  const vacantPercent =
    totalRoomsCount > 0 ? Math.round(((vacantRooms ?? 0) / totalRoomsCount) * 100) : 0;
  const occupiedPercent =
    totalRoomsCount > 0 ? Math.round(((occupiedRooms ?? 0) / totalRoomsCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Tổng quan Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Sẵn sàng
            </span>
          </div>
          <p className="text-base text-slate-500 mt-1.5 font-normal">
            Báo cáo tổng quan tình hình hoạt động kinh doanh & chỉ số vận hành nhà trọ
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={isAnyLoading}
          className="self-start sm:self-auto gap-2 rounded-xl border-slate-300 text-slate-800 font-semibold hover:bg-slate-100 h-10 px-4 text-sm"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${isAnyLoading ? "animate-spin text-slate-900" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* 2. Top Metric Grid: 4 Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Chỉ số cốt lõi */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chỉ số cốt lõi
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>

          {loadingCoreStats ? (
            <div className="space-y-2 py-1">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : errorCoreStats ? (
            <div className="flex items-center gap-2 text-red-600 py-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Lỗi tải dữ liệu</span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-black text-slate-900">
                  {totalProperties ?? 0}
                </span>
                <span className="text-base font-semibold text-slate-500">Nhà trọ</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm pt-3 border-t border-slate-100 font-semibold">
                <span className="text-slate-500">Hợp đồng hiệu lực:</span>
                <span className="text-slate-900 bg-slate-100 px-3 py-1 rounded-md font-bold">
                  {activeLeasesCount ?? 0} hợp đồng
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Trạng thái phòng (Teal/Green for Occupied, Gray for Vacant) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trạng thái phòng
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
              <Home className="h-5 w-5" />
            </div>
          </div>

          {loadingRoomStats ? (
            <div className="space-y-2 py-1">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : errorRoomStats ? (
            <div className="flex items-center gap-2 text-red-600 py-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Lỗi tải dữ liệu</span>
            </div>
          ) : totalRoomsCount === 0 ? (
            <div className="py-1">
              <p className="text-sm text-slate-500 font-medium mb-1">Chưa có thông tin phòng</p>
              <Link
                href="/dashboard/properties"
                className="text-sm text-slate-900 font-bold hover:underline"
              >
                + Thêm phòng
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-4xl lg:text-5xl font-black text-slate-900">
                  {occupiedPercent}%
                </span>
                <span className="text-base font-semibold text-slate-500">Tỉ lệ lấp đầy</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex mb-3 border border-slate-200/60">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${occupiedPercent}%` }}
                />
                <div
                  className="h-full bg-slate-300 transition-all duration-300"
                  style={{ width: `${vacantPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100 font-semibold">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Đã thuê: {occupiedRooms ?? 0}
                </span>
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Còn trống: {vacantRooms ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Thống kê tài chính (Green for Paid, Red for Unpaid) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thống kê tài chính
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          {loadingFinancialStats ? (
            <div className="space-y-2 py-1">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-5 w-28" />
            </div>
          ) : errorFinancialStats ? (
            <div className="flex items-center gap-2 text-red-600 py-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Lỗi tải dữ liệu</span>
            </div>
          ) : (
            <div>
              <div className="text-3xl xl:text-4xl font-black text-slate-900 truncate">
                {formatCurrency(totalPaidRevenue)}
              </div>
              <p className="text-sm font-bold text-emerald-700 mt-1">Đã thu thực tế</p>
              <div className="mt-4 flex items-center justify-between text-sm pt-3 border-t border-slate-100 font-semibold">
                <span className="text-slate-500">Tiền chưa thu:</span>
                <span
                  className={`px-3 py-1 rounded-md ${
                    (totalUnpaidRevenue ?? 0) > 0
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {formatCurrency(totalUnpaidRevenue)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Hợp đồng hết hạn (Amber for Attention) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hợp đồng hết hạn
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          {loadingExpiringContracts ? (
            <div className="space-y-2 py-1">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : errorExpiringContracts ? (
            <div className="flex items-center gap-2 text-red-600 py-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Lỗi tải dữ liệu</span>
            </div>
          ) : expiringContracts.length === 0 ? (
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Ổn định</span>
              </div>
              <p className="text-sm text-slate-500 font-normal mt-1">
                Không có hợp đồng hết hạn (trong 30 ngày)
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-black text-amber-600">
                  {expiringContracts.length}
                </span>
                <span className="text-base font-semibold text-amber-700">cần gia hạn</span>
              </div>
              <div className="mt-2 space-y-1.5 max-h-[55px] overflow-y-auto pr-1">
                {expiringContracts.slice(0, 2).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-sm py-0.5 text-slate-800"
                  >
                    <span className="font-semibold truncate max-w-[130px]">
                      {c.contractNumber}
                    </span>
                    <Link
                      href={`/dashboard/contracts/${c.id}`}
                      className="text-amber-700 font-bold hover:underline text-xs"
                    >
                      Xem
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Grid Section: Property List (Left 2-Cols) & Quick Actions (Right 1-Col) */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Left Column (2 Cols): Property Overview List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-2">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                  <Building2 className="h-6 w-6 text-slate-900" />
                  Danh sách Nhà trọ đang quản lý
                </h2>
                <p className="text-base text-slate-500 mt-1 font-normal">
                  Tổng quan chi tiết các bất động sản và trạng thái phòng thực tế
                </p>
              </div>
              {propertiesList.length > 0 && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="self-start sm:self-auto text-slate-900 hover:text-black hover:bg-slate-100 font-bold text-base rounded-xl gap-1.5 h-10 px-4"
                >
                </Button>
              )}
            </div>

            {loadingRoomStats ? (
              <div className="space-y-4 py-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : propertiesList.length === 0 ? (
              /* Minimal Monochromatic Onboarding Empty State */
              <div className="py-12 px-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <Building2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Chưa có nhà trọ nào được tạo</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  Tạo nhà trọ đầu tiên của bạn để bắt đầu quản lý các phòng, khách thuê và hợp đồng.
                </p>

                <Button asChild size="default" className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 py-2.5 shadow-xs gap-2">
                  <Link href="/dashboard/properties/new">
                    <PlusCircle className="h-5 w-5" />
                    Tạo nhà trọ ngay
                  </Link>
                </Button>
              </div>
            ) : (
              /* Properties Table View */
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200/90 font-bold text-xs uppercase tracking-wider">
                        <th className="pb-4 pr-4">Nhà trọ</th>
                        <th className="pb-4 px-3">Loại hình</th>
                        <th className="pb-4 px-3 text-center">Tổng số phòng</th>
                        <th className="pb-4 px-3">Trạng thái phòng</th>
                        <th className="pb-4 pl-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {propertiesList.slice(0, 5).map((item) => {
                        const avail = item.statistics?.availableRooms ?? 0;
                        const occupied = item.statistics?.occupiedRooms ?? 0;
                        const total = item.statistics?.totalRooms ?? item.roomCount ?? 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-4 pr-4">
                              <div className="font-bold text-slate-900 group-hover:text-black transition-colors text-base">
                                {item.name}
                              </div>
                              <div className="text-slate-500 truncate max-w-[260px] text-sm font-normal mt-0.5">
                                {item.address}
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200/60">
                                {formatPropertyType(item.propertyType)}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                              <span className="font-extrabold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md text-sm sm:text-base">
                                {total} phòng
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                                <span className="text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md">
                                  {avail} trống
                                </span>
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                                  {occupied} đã thuê
                                </span>
                              </div>
                            </td>
                            <td className="py-4 pl-3 text-right">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 rounded-xl text-sm font-bold border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                              >
                                <Link href="/dashboard/properties">
                                  Chi tiết
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Table Footer Info */}
          {propertiesList.length > 0 && (
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 font-semibold">
              <span>Đang hiển thị {Math.min(propertiesList.length, 5)} / {propertiesList.length} nhà trọ</span>
              <Link href="/dashboard/properties" className="text-slate-900 font-bold hover:underline flex items-center gap-1.5">
                Quản lý tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2.5">
              <PlusCircle className="h-6 w-6 text-slate-900" />
              Hành động nhanh
            </h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/properties/new"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200/80 transition-all font-semibold text-base group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 text-slate-900 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <span>Thêm Nhà trọ</span>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/dashboard/contracts/new"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200/80 transition-all font-semibold text-base group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 text-slate-900 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <FilePlus className="h-5 w-5" />
                  </div>
                  <span>Thêm Hợp đồng</span>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/dashboard/invoices/new"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200/80 transition-all font-semibold text-base group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 text-slate-900 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <span>Tạo Hóa đơn</span>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-sm text-slate-500 font-medium flex items-center justify-between">
            <span>Thao tác nhanh 1-Click</span>
            <span className="text-slate-900 font-bold">Rent Easy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
