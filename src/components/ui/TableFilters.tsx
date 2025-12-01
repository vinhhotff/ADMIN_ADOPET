'use client';

import { Search, X, Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

interface TableFiltersProps {
  emailPlaceholder?: string;
  showDateRange?: boolean;
}

export function TableFilters({ emailPlaceholder = 'Tìm kiếm...', showDateRange = true }: TableFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');

  const hasFilters = email || from || to;

  // Auto-apply filters on change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email || from || to) {
        applyFilters();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, from, to]);

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const query = params.toString();
      router.push(query ? `?${query}` : window.location.pathname);
    });
  };

  const clearFilters = () => {
    setEmail('');
    setFrom('');
    setTo('');
    startTransition(() => {
      router.push(window.location.pathname);
    });
  };

  return (
    <div className="filters-bar">
      <div className="filters-bar__search">
        <Search size={16} />
        <input
          type="text"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {email && (
          <button className="filters-bar__clear-input" onClick={() => setEmail('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {showDateRange && (
        <div className="filters-bar__dates">
          <div className="filters-bar__date-input">
            <Calendar size={14} />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Từ ngày"
            />
          </div>
          <span className="filters-bar__separator">→</span>
          <div className="filters-bar__date-input">
            <Calendar size={14} />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Đến ngày"
            />
          </div>
        </div>
      )}

      {hasFilters && (
        <button className="filters-bar__reset" onClick={clearFilters} disabled={isPending}>
          <X size={14} />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
