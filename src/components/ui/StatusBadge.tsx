import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  processing: 'warning',
  completed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
  open: 'warning',
  under_review: 'warning',
  resolved: 'success',
  closed: 'neutral',
  disputed: 'warning',
  approved: 'success',
  rejected: 'danger',
  flagged: 'warning',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = STATUS_COLORS[status] ?? 'neutral';
  const label = status.replace('_', ' ');

  return <span className={clsx('status-badge', `status-badge--${variant}`)}>{label}</span>;
}
