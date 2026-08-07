import api from './api';
import type { Review } from '../types';

export const fetchReviews = async (watchSlug: string): Promise<Review[]> => {
  const { data } = await api.get<Review[]>(`/api/v1/watches/${watchSlug}/reviews/`);
  return data;
};

export interface ReviewPayload {
  rating: number;
  title?: string;
  body: string;
}

export const createReview = async (watchSlug: string, payload: ReviewPayload): Promise<Review> => {
  const { data } = await api.post<Review>(`/api/v1/watches/${watchSlug}/reviews/`, payload);
  return data;
};