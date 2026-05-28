import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export type Product = {
  id: number;
  category_id: number | null;
  category?: Category | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_price: number | null;
  image_path: string | null;
  image_url: string | null;
  badge: string | null;
  rating: string | number | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
};

export type Promotion = {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_path: string | null;
  image_url: string | null;
  badge: string | null;
  discount: string | null;
  starts_at: string | null;
  ends_at: string | null;
  highlight: boolean;
  active: boolean;
  sort_order: number;
};

export type MediaItem = {
  id: number;
  type: 'image' | 'video';
  title: string | null;
  album: string;
  src_path: string | null;
  thumb_path: string | null;
  src_url: string | null;
  thumb_url: string | null;
  sort_order: number;
  active: boolean;
};

export type Lead = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  email: string;
  interest: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  created_at: string;
};

export type SiteSetting = {
  id: number;
  key: string;
  value: unknown;
  group: string;
};

const list = <T,>(url: string) => async (): Promise<T[]> => (await adminApi.get(url)).data;

export const useCategories = () =>
  useQuery({ queryKey: ['admin', 'categories'], queryFn: list<Category>('/admin/categories') });

export const useProducts = () =>
  useQuery({ queryKey: ['admin', 'products'], queryFn: list<Product>('/admin/products') });

export const usePromotions = () =>
  useQuery({ queryKey: ['admin', 'promotions'], queryFn: list<Promotion>('/admin/promotions') });

export const useMediaItems = () =>
  useQuery({ queryKey: ['admin', 'media'], queryFn: list<MediaItem>('/admin/media') });

export const useLeads = () =>
  useQuery({ queryKey: ['admin', 'leads'], queryFn: list<Lead>('/admin/leads') });

export const useSettings = () =>
  useQuery({ queryKey: ['admin', 'settings'], queryFn: list<SiteSetting>('/admin/settings') });

export const useDashboard = () =>
  useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await adminApi.get('/admin/dashboard')).data,
  });

export const useResourceMutations = <T extends { id: number }>(resource: string) => {
  const qc = useQueryClient();
  const key = ['admin', resource];

  const create = useMutation({
    mutationFn: async (data: FormData | Partial<T>) => {
      const isForm = data instanceof FormData;
      const res = await adminApi.post(`/admin/${resource}`, data, {
        headers: isForm ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData | Partial<T> }) => {
      const isForm = data instanceof FormData;
      if (isForm) {
        data.append('_method', 'PUT');
        const res = await adminApi.post(`/admin/${resource}/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      }
      const res = await adminApi.put(`/admin/${resource}/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const destroy = useMutation({
    mutationFn: async (id: number) => (await adminApi.delete(`/admin/${resource}/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { create, update, destroy };
};
