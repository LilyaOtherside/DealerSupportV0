'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DealerCenterSelectionProps {
  city: string;
  onNext: (dealerCenter: string) => void;
}

export default function DealerCenterSelection({ city, onNext }: DealerCenterSelectionProps) {
  const [dealerCenters, setDealerCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDealerCenters() {
      const { data, error } = await supabase
        .from('dealer_centers')
        .select('name')
        .eq('city', city);

      if (!error && data) {
        setDealerCenters(data.map(dc => dc.name));
      }
      setLoading(false);
    }

    fetchDealerCenters();
  }, [city]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6">Оберіть дилерський центр</h2>
      <div className="flex flex-col gap-4 w-full max-w-md">
        {dealerCenters.map((center) => (
          <button
            key={center}
            onClick={() => onNext(center)}
            className="bg-white border-2 border-gray-200 p-4 rounded-lg hover:border-blue-500 transition-colors text-left"
          >
            {center}
          </button>
        ))}
      </div>
    </div>
  );
} 