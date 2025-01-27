'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Request } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Clock, 
  AlertCircle,
  MessageCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-blue-500 bg-blue-500/10';
      case 'in_progress':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'resolved':
        return 'text-green-500 bg-green-500/10';
      case 'closed':
        return 'text-gray-500 bg-gray-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-tg-theme-bg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-theme-bg text-white">
      {/* Верхня панель */}
      <div className="bg-tg-theme-section p-4 flex justify-between items-center safe-top">
        <div className="text-lg font-medium">Запити</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/requests/new')}
          className="text-blue-500"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Список запитів */}
      <div className="p-4">
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="bg-tg-theme-section rounded-xl p-8">
              <div className="text-center space-y-3">
                <MessageCircle className="h-8 w-8 mx-auto text-tg-theme-hint" />
                <p className="text-tg-theme-hint">
                  У вас поки немає запитів
                </p>
                <Button
                  onClick={() => router.push('/requests/new')}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Створити запит
                </Button>
              </div>
            </div>
          ) : (
            requests.map((request) => (
              <button
                key={request.id}
                onClick={() => router.push(`/requests/${request.id}`)}
                className="w-full bg-tg-theme-section rounded-xl p-4 text-left transition-all hover:bg-tg-theme-button"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium line-clamp-1">{request.title}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {request.priority === 'low' ? 'Низький' : 
                     request.priority === 'medium' ? 'Середній' : 'Високий'}
                  </span>
                </div>
                
                <p className="text-sm text-tg-theme-hint line-clamp-2 mb-3">
                  {request.description}
                </p>

                <Separator className="my-3 bg-tg-theme-button" />

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center text-tg-theme-hint">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                      {request.status === 'new' ? 'Новий' :
                       request.status === 'in_progress' ? 'В роботі' :
                       request.status === 'resolved' ? 'Вирішено' : 'Закрито'}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-2 text-tg-theme-hint" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Нижня навігація */}
      <div className="fixed bottom-0 left-0 right-0 bg-tg-theme-section p-4 flex justify-around safe-bottom">
        <Button variant="ghost" size="icon" className="text-tg-theme-hint">
          <span className="text-xl">🏠</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-500">
          <span className="text-xl">⚡</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-tg-theme-hint">
          <span className="text-xl">⚙️</span>
        </Button>
      </div>
    </div>
  );
} 