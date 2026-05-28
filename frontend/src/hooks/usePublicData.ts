import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type PublicProduct = {
  id: number;
  category_id: number | null;
  category?: PublicCategory | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  badge: string | null;
  rating: string | number | null;
  featured: boolean;
};

export type PublicPromotion = {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  badge: string | null;
  discount: string | null;
  starts_at: string | null;
  ends_at: string | null;
  highlight: boolean;
};

export type PublicMedia = {
  id: number;
  type: 'image' | 'video';
  title: string | null;
  album: string;
  src_url: string | null;
  thumb_url: string | null;
};

export type SettingsMap = Record<string, string>;

export const useSiteSettings = () =>
  useQuery({
    queryKey: ['public', 'settings'],
    queryFn: async (): Promise<SettingsMap> => {
      const res = await api.get('/public/settings');
      const data = res.data as Record<string, unknown>;
      const flat: SettingsMap = {};
      Object.entries(data).forEach(([k, v]) => {
        flat[k] = typeof v === 'string' ? v : String(v ?? '');
      });
      return flat;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

export const usePublicCategories = () =>
  useQuery({
    queryKey: ['public', 'categories'],
    queryFn: async (): Promise<PublicCategory[]> => (await api.get('/public/categories')).data,
  });

export const usePublicProducts = (params?: { featured?: boolean; category?: string; q?: string }) =>
  useQuery({
    queryKey: ['public', 'products', params],
    queryFn: async (): Promise<PublicProduct[]> => (await api.get('/public/products', { params })).data,
  });

export const usePublicPromotions = () =>
  useQuery({
    queryKey: ['public', 'promotions'],
    queryFn: async (): Promise<PublicPromotion[]> => (await api.get('/public/promotions')).data,
  });

export const usePublicGallery = () =>
  useQuery({
    queryKey: ['public', 'gallery'],
    queryFn: async (): Promise<PublicMedia[]> => (await api.get('/public/gallery')).data,
  });

export const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
