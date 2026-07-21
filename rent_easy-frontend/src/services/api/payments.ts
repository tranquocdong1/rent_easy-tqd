import axiosInstance from '@/lib/axios';
import { PaymentQuery, PaymentsResponse, PaymentMethod, Payment } from '@/types/payment';

export const getPayments = async (query?: PaymentQuery): Promise<PaymentsResponse> => {
  const { data } = await axiosInstance.get<PaymentsResponse>('/v1/payments', { params: query });
  return data;
};

export interface CreatePaymentPayload {
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  note?: string;
}

export const createPayment = async (payload: CreatePaymentPayload): Promise<{ message: string; data: Payment }> => {
  const { data } = await axiosInstance.post('/v1/payments', payload);
  return data;
};
