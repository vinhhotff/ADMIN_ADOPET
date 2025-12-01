'use server';

import { fetchAllAnalyticsData } from '@/lib/data/analytics';
import { generateCSVReport } from '@/lib/data/reports';

export async function exportReportAction(period: 'daily' | 'weekly' | 'monthly') {
  const data = await fetchAllAnalyticsData();
  const csv = await generateCSVReport(data, { period, format: 'csv' });
  
  return csv;
}

