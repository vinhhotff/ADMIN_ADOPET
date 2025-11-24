import clsx from 'clsx';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  accent?: 'primary' | 'success' | 'warning';
}

export function StatCard({ label, value, icon, trend, accent = 'primary' }: StatCardProps) {
  return (
    <div className={clsx('stat-card', `stat-card--${accent}`)}>
      <div className="stat-card__header">
        <p>{label}</p>
        {icon}
      </div>
      <h3>{value}</h3>
      {trend && <span className="stat-card__trend">{trend}</span>}
    </div>
  );
}
