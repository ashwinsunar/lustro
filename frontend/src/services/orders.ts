import api from './api';
import type { Order, Coupon } from '../types';

export interface CreateOrderPayload {
  items: { watch_id: number; quantity: number }[];
  shipping: {
    full_name: string;
    email: string;
    phone_number: string;
    address_line: string;
    city: string;
    postal_code: string;
    country: string;
  };
  payment_method: 'card' | 'cod';
  coupon_code?: string;
  gift_wrapping?: boolean;
  notes?: string;
}

export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const { data } = await api.post<Order>('/api/v1/orders/', payload);
  return data;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/api/v1/orders/');
  return data;
};

export const fetchOrder = async (orderNumber: string): Promise<Order> => {
  const { data } = await api.get<Order>(`/api/v1/orders/${orderNumber}/`);
  return data;
};

export const validateCoupon = async (code: string): Promise<Coupon> => {
  const { data } = await api.get<Coupon>(`/api/v1/orders/coupon/${code}/`);
  return data;
};

export const cancelOrder = async (orderNumber: string): Promise<Order> => {
  const { data } = await api.post<Order>(`/api/v1/orders/${orderNumber}/cancel/`);
  return data;
};
