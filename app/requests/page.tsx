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
  Loader2, 
  Filter, 
  Search, 
  Sun, 
  Moon,
  User2
} from 'lucide-react';
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function RequestsPage() {
  const { user, loading } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

  const filteredRequests = requests.filter((req) => {
    const matchesQuery =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-tg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#121212]" : "bg-white"} transition-colors duration-200`}>
      {/* Верхня панель */}
      <div className={`${isDark ? "bg-[#1E1E1E]/80" : "bg-gray-100/80"} backdrop-blur-lg p-4 sticky top-0 z-10 safe-top`}>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={toggleTheme}
            className="hover:opacity-80 transition-opacity"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-white" />
            ) : (
              <Moon className="h-5 w-5 text-black" />
            )}
          </button>
          <div className="text-xl font-semibold flex-1">Запити</div>
          <div className="h-8 w-8 bg-[#6C5DD3] rounded-full flex items-center justify-center">
            <span className="text-sm text-white">L</span>
          </div>
        </div>

        {/* Пошук та фільтри */}
        <div className="flex gap-2">
          <div className={`flex-1 flex items-center gap-2 ${isDark ? "bg-[#1E1E1E]" : "bg-gray-100"} rounded-lg px-3 py-2`}>
            <Search className={isDark ? "text-gray-400" : "text-gray-500"} size={20} />
            <input
              type="text"
              placeholder="Пошук запитів..."
              className={`bg-transparent border-none outline-none w-full ${isDark ? "text-gray-300 placeholder:text-gray-400" : "text-gray-700 placeholder:text-gray-500"}`}
            />
          </div>
          <button className={`px-4 py-2 ${isDark ? "bg-[#1E1E1E] text-white" : "bg-gray-100 text-black"} rounded-lg`}>
            Всі
          </button>
          <button className={`p-2 ${isDark ? "bg-[#1E1E1E]" : "bg-gray-100"} rounded-lg`}>
            <Filter className={isDark ? "text-white" : "text-black"} size={20} />
          </button>
        </div>
      </div>

      {/* Список запитів */}
      <div className="p-4 space-y-4">
        {requests.length === 0 || filteredRequests.length === 0 ? (
          <div className="bg-tg-theme-section/50 backdrop-blur-lg rounded-2xl p-8">
            <div className="text-center space-y-4">
              <div className="bg-blue-500/10 rounded-full p-4 w-fit mx-auto">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">Немає запитів</p>
                <p className="text-tg-theme-hint text-sm mb-4">
                  Створіть свій перший запит для підтримки
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
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                onClick={() => router.push(`/requests/${request.id}`)}
                className="w-full bg-tg-theme-section/50 backdrop-blur-lg rounded-2xl p-4 text-left transition-all hover:bg-tg-theme-section hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-1 mb-1">{request.title}</h3>
                    <p className="text-sm text-tg-theme-hint line-clamp-2 mb-3">
                      {request.description}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    request.priority === 'high' 
                      ? 'bg-red-500/10 text-red-500' 
                      : request.priority === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-green-500/10 text-green-500'
                  }`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {request.priority === 'low' ? 'Низький' : 
                     request.priority === 'medium' ? 'Середній' : 'Високий'}
                  </span>
                </div>

                <Separator className="my-3 bg-tg-theme-button/50" />

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center text-tg-theme-hint">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                      request.status === 'new' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : request.status === 'in_progress'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : request.status === 'resolved'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {request.status === 'new' ? 'Новий' :
                       request.status === 'in_progress' ? 'В роботі' :
                       request.status === 'resolved' ? 'Вирішено' : 'Закрито'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-tg-theme-hint" />
                  </div>
                </div>

                {request.media_urls.length > 0 && (
                  <div className="flex gap-1 mt-3">
                    {request.media_urls.slice(0, 3).map((media, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 rounded-lg bg-tg-theme-button/50 flex items-center justify-center overflow-hidden"
                      >
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {media.type === 'video' ? '🎥' : '📄'}
                          </span>
                        )}
                      </div>
                    ))}
                    {request.media_urls.length > 3 && (
                      <div className="w-12 h-12 rounded-lg bg-tg-theme-button/50 flex items-center justify-center text-sm text-tg-theme-hint">
                        +{request.media_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/requests/new')}
                className="text-blue-500 hover:bg-blue-500/10 h-12 w-12"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
} 