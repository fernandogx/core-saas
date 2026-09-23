'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Boxes, Users, Package, Layers, Repeat, Receipt, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications', label: 'Applications', icon: Boxes },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/plans', label: 'Planos', icon: Layers },
  { href: '/subscriptions', label: 'Assinaturas', icon: Repeat },
  { href: '/invoices', label: 'Faturas', icon: Receipt },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="text-xl font-bold">
          Core<span className="text-primary">SaaS</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
