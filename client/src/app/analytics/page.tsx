'use client';

import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
        <AnalyticsPanel isOpen={true} onClose={() => {}} />
      </div>
    </div>
  );
}
