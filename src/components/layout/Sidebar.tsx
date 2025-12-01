'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Coins, ShieldAlert, Users, Film, PawPrint, FileText, BarChart3, Percent, CheckCircle, Shield, ShoppingCart, Package } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Commissions', href: '/commissions', icon: Percent },
  { label: 'Payouts', href: '/payouts', icon: Coins },
  { label: 'Disputes', href: '/disputes', icon: ShieldAlert },
  { label: 'Seller Verification', href: '/sellers/verification', icon: CheckCircle },
  { label: 'Pet Vaccination', href: '/pets/vaccination', icon: Shield },
  { label: 'Content Reports', href: '/reports', icon: ShieldAlert },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Products', href: '/products', icon: Package },
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
