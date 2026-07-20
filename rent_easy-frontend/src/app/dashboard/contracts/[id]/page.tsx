'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useContract } from '@/hooks/use-contracts';
import { ContractStatus } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
};

const StatusBadge = ({ status }: { status: ContractStatus }) => {
  const badgeColors: Record<ContractStatus, string> = {
    [ContractStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [ContractStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ContractStatus.EXPIRED]: 'bg-slate-100 text-slate-800',
    [ContractStatus.TERMINATED]: 'bg-red-100 text-red-800',
    [ContractStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };

  const statusMap: Record<ContractStatus, string> = {
    [ContractStatus.PENDING]: 'Chờ duyệt',
    [ContractStatus.ACTIVE]: 'Đang hiệu lực',
    [ContractStatus.EXPIRED]: 'Đã hết hạn',
    [ContractStatus.TERMINATED]: 'Đã chấm dứt',
    [ContractStatus.CANCELLED]: 'Đã huỷ',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColors[status]}`}>
      {statusMap[status]}
    </span>
  );
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { data, isLoading, error } = useContract(contractId);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error ? (error as any).response?.data?.message || 'Có lỗi xảy ra.' : 'Không tìm thấy hợp đồng.'}
        </div>
      </div>
    );
  }

  const contract = data.data;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Hợp đồng: {contract.contractNumber}
              <StatusBadge status={contract.status} />
            </h1>
          </div>
        </div>
        <Link href={`/dashboard/contracts/${contract.id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Sửa
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="info">Thông tin hợp đồng</TabsTrigger>
          <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
          <TabsTrigger value="payments">Thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết hợp đồng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Số hợp đồng:</span>
                  <span className="font-medium">{contract.contractNumber}</span>
                  
                  <span className="text-muted-foreground">Thời hạn:</span>
                  <span className="font-medium">
                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                  </span>
                  
                  <span className="text-muted-foreground">Tiền thuê:</span>
                  <span className="font-medium">{formatCurrency(contract.monthlyRent)}/tháng</span>
                  
                  <span className="text-muted-foreground">Tiền cọc:</span>
                  <span className="font-medium">{formatCurrency(contract.depositAmount)}</span>

                  <span className="text-muted-foreground">Ghi chú:</span>
                  <span className="font-medium">{contract.note || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Tổng hóa đơn:</span>
                  <span className="font-medium">{contract.summary.totalInvoices}</span>
                  
                  <span className="text-muted-foreground">Hóa đơn chưa TT:</span>
                  <span className="font-medium text-red-600">{contract.summary.unpaidInvoices}</span>
                  
                  <span className="text-muted-foreground">Tổng đã thanh toán:</span>
                  <span className="font-medium text-green-600">{formatCurrency(contract.summary.totalPaid)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Khách thuê</CardTitle>
                <Link href={`/dashboard/tenants/${contract.tenant.id}`}>
                  <Button variant="link" className="px-0">View Tenant</Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Họ tên:</span>
                  <span className="font-medium">{contract.tenant.fullName}</span>
                  
                  <span className="text-muted-foreground">Số điện thoại:</span>
                  <span className="font-medium">{contract.tenant.phone}</span>
                  
                  <span className="text-muted-foreground">CCCD:</span>
                  <span className="font-medium">{contract.tenant.identityNumber}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Phòng & Khu trọ</CardTitle>
                <Link href={`/dashboard/rooms/${contract.room.id}`}>
                  <Button variant="link" className="px-0">View Room</Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Khu trọ:</span>
                  <span className="font-medium">{contract.property.name}</span>
                  
                  <span className="text-muted-foreground">Phòng:</span>
                  <span className="font-medium">{contract.room.name} ({contract.room.code})</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                Lịch sử hóa đơn sẽ được cập nhật sau khi hoàn thành Module Invoice.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                Lịch sử thanh toán sẽ được cập nhật sau khi hoàn thành Module Payment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
