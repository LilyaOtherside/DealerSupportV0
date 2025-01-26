'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequestsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-tg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-theme-bg text-white">
      {/* Верхня панель */}
      <div className="bg-tg-theme-section p-4 flex justify-between items-center safe-top">
        <div className="text-lg font-medium">Запити</div>
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">➕</span>
        </button>
      </div>

      {/* Список запитів */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Заглушка для запитів */}
          <div className="bg-tg-theme-section rounded-xl p-4">
            <p className="text-tg-theme-hint text-center py-8">
              У вас поки немає запитів
            </p>
          </div>
        </div>
      </div>

      {/* Нижня навігація */}
      <div className="fixed bottom-0 left-0 right-0 bg-tg-theme-section p-4 flex justify-around safe-bottom">
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">🏠</span>
        </button>
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">⚡</span>
        </button>
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">⚙️</span>
        </button>
      </div>
    </div>
  );
} 