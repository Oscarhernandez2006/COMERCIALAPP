import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

export function Layout() {
  return (
    <ThemeProvider>
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
      <ScrollRestoration />
    </div>
    </ThemeProvider>
  )
}
