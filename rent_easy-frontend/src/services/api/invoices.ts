import axiosInstance from '@/lib/axios';
import { InvoiceQuery, InvoicesResponse } from '@/types/invoice';

export const getInvoices = async (query?: InvoiceQuery): Promise<InvoicesResponse> => {
  const { data } = await axiosInstance.get<InvoicesResponse>('/v1/invoices', { params: query });
  return data;
};
