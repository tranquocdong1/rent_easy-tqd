import axiosInstance from '@/lib/axios';
import { InvoiceQuery, InvoicesResponse, CreateInvoiceRequest, InvoiceResponse, InvoiceDetailResponse, UpdateInvoiceRequest } from '@/types/invoice';

export const getInvoices = async (query?: InvoiceQuery): Promise<InvoicesResponse> => {
  const { data } = await axiosInstance.get<InvoicesResponse>('/v1/invoices', { params: query });
  return data;
};

export const createInvoice = async (payload: CreateInvoiceRequest): Promise<InvoiceResponse> => {
  const { data } = await axiosInstance.post<InvoiceResponse>('/v1/invoices', payload);
  return data;
};

export const getInvoiceById = async (id: string): Promise<InvoiceDetailResponse> => {
  const { data } = await axiosInstance.get<InvoiceDetailResponse>(`/v1/invoices/${id}`);
  return data;
};

export const updateInvoice = async (id: string, payload: UpdateInvoiceRequest): Promise<InvoiceDetailResponse> => {
  const { data } = await axiosInstance.patch<InvoiceDetailResponse>(`/v1/invoices/${id}`, payload);
  return data;
};

export const deleteInvoice = async (id: string): Promise<{ message: string; data: null }> => {
  const { data } = await axiosInstance.delete<{ message: string; data: null }>(`/v1/invoices/${id}`);
  return data;
};
