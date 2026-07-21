import axiosInstance from '@/lib/axios';
import { PaymentQuery, PaymentsResponse } from '@/types/payment';

export const getPayments = async (query?: PaymentQuery): Promise<PaymentsResponse> => {
  const { data } = await axiosInstance.get<PaymentsResponse>('/v1/payments', { params: query });
  return data;
};
