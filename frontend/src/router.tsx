import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/site/Layout';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import Promotions from '@/pages/Promotions';
import Gallery from '@/pages/Gallery';
import Sales from '@/pages/Sales';
import NotFound from '@/pages/NotFound';

import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminLogin from '@/pages/admin/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminCategories from '@/pages/admin/Categories';
import AdminProducts from '@/pages/admin/Products';
import AdminPromotions from '@/pages/admin/Promotions';
import AdminGallery from '@/pages/admin/Gallery';
import AdminLeads from '@/pages/admin/Leads';
import AdminChats from '@/pages/admin/Chats';
import AdminSettings from '@/pages/admin/Settings';
import AdminAppearance from '@/pages/admin/Appearance';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalogo', element: <Catalog /> },
      { path: 'promociones', element: <Promotions /> },
      { path: 'galeria', element: <Gallery /> },
      { path: 'vendedor', element: <Sales /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'productos', element: <AdminProducts /> },
      { path: 'promociones', element: <AdminPromotions /> },
      { path: 'categorias', element: <AdminCategories /> },
      { path: 'galeria', element: <AdminGallery /> },
      { path: 'leads', element: <AdminLeads /> },
      { path: 'chats', element: <AdminChats /> },
      { path: 'apariencia', element: <AdminAppearance /> },
      { path: 'ajustes', element: <AdminSettings /> },
    ],
  },
]);
