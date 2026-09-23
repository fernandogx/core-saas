'use client';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { user, logout } = useAuthStore();
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div>
        <span className="text-sm text-muted-foreground">Conectado ao Core Admin</span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.name}</span>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
