'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Request } from '@/app/types';

export default function RequestsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as Request[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
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
        <button 
          onClick={() => router.push('/requests/new')}
          className="p-2 rounded-full bg-tg-theme-button"
        >
          <span className="text-xl">➕</span>
        </button>
      </div>

      {/* Список запитів */}
      <div className="p-4">
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-tg-theme-section rounded-xl p-4">
              <p className="text-tg-theme-hint text-center py-8">
                У вас поки немає запитів
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <button
                key={request.id}
                onClick={() => router.push(`/requests/${request.id}`)}
                className="w-full bg-tg-theme-section rounded-xl p-4 text-left"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{request.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    request.priority === 'high' 
                      ? 'bg-red-500' 
                      : request.priority === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}>
                    {request.priority}
                  </span>
                </div>
                <p className="text-sm text-tg-theme-hint line-clamp-2">
                  {request.description}
                </p>
                <div className="flex justify-between items-center mt-2 text-xs text-tg-theme-hint">
                  <span>
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  <span className="capitalize">{request.status}</span>
                </div>
              </button>
            ))
          )}
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