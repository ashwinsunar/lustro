import api from './api';
import type { Category } from '../types';

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>('/api/v1/categories/');
  return data;
};
