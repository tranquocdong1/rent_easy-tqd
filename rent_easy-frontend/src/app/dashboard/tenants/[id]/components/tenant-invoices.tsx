"use client";

import { useEffect, useState } from "react";
import { getInvoices } from "@/services/api/invoices";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const invoiceStatusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  [InvoiceStatus.DRAFT]: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
  [InvoiceStatus.UNPAID]: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800' },
  [InvoiceStatus.PARTIALLY_PAID]: { label: 'Thanh toán một phần', color: 'bg-yellow-100 text-yellow-800' },
  [InvoiceStatus.PAID]: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  [InvoiceStatus.OVERDUE]: { label: 'Quá hạn', color: 'bg-red-100 text-red-800' },
  [InvoiceStatus.CANCELLED]: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
};

export function TenantInvoices({ tenantId }: { tenantId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await getInvoices({ tenantId, limit: 100 });
        setInvoices(res.data.items);
      } catch (err: any) {
        setError("Không thể tải lịch sử thanh toán");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [tenantId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (invoices.length === 0) {
    return <div className="p-8 text-center text-slate-500">Chưa có hóa đơn nào.</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã HĐ</TableHead>
              <TableHead>Kỳ HĐ</TableHead>
              <TableHead>Hạn chót</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Còn nợ</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.billingPeriod}</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell className={invoice.remainingAmount > 0 ? "text-red-500 font-medium" : "text-green-600"}>
                  {formatCurrency(invoice.remainingAmount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={invoiceStatusMap[invoice.status].color}>
                    {invoiceStatusMap[invoice.status].label}
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
