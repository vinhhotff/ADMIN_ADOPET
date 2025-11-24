'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Coins, ShieldAlert, Users, Film, PawPrint, FileText } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Payouts', href: '/payouts', icon: Coins },
  { label: 'Disputes', href: '/disputes', icon: ShieldAlert },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Reels', href: '/reels', icon: Film },
  { label: 'Pets', href: '/pets', icon: PawPrint },
  { label: 'Posts', href: '/posts', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__dot" />
        <div>
          <p className="sidebar__title">Adopet Admin</p>
          <p className="sidebar__subtitle">Escrow & payouts</p>
        </div>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('sidebar__nav-item', active && 'sidebar__nav-item--active')}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
