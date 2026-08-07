import api from './api';
import type { Brand } from '../types';

export const fetchBrands = async (): Promise<Brand[]> => {
  const { data } = await api.get<Brand[]>('/api/v1/brands/');
  return data;
};

export const fetchBrand = async (slug: string): Promise<Brand> => {
  const { data } = await api.get<Brand>(`/api/v1/brands/${slug}/`);
  return data;
};
