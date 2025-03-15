'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Request } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  ChevronRight, 
  Loader2, 
  Filter, 
  Search, 
  User2,
  Edit2,
  Trash2,
  Paperclip
} from 'lucide-react';
import { BottomNav } from "@/components/BottomNav";

interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'document';
  name?: string;
  icon?: string;
  originalName?: string;
}

export default function RequestsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const tabs = [
    { id: 'requests', label: 'Запити' },
    { id: 'archive', label: 'Архів' }
  ];

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

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [showArchived]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', showArchived)
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

  const handleDeleteRequest = async (requestId: string) => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Оновлюємо список запитів після видалення
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Помилка при видаленні запиту');
    } finally {
      setIsDeleting(false);
      setRequestToDelete(null);
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
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white pt-5">
      {/* Верхня панель */}
      <div className="bg-tg-theme-bg/80 backdrop-blur-lg p-4 sticky top-0 z-10 safe-top">
        <div className="flex justify-between items-center mb-4">
          <div className="w-8" />
          <div className="text-xl font-semibold">Запити</div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-tg-theme-button/50"
            onClick={() => router.push('/profile')}
          >
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User2 className="h-5 w-5 text-tg-theme-hint" />
            )}
          </Button>
        </div>

        {/* Пошук та сортування за статусом */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tg-theme-hint" />
            <input
              type="text"
              placeholder="Пошук запитів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-tg-theme-section/50 rounded-full pl-10 pr-4 py-2 text-sm placeholder:text-tg-theme-hint focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-tg-theme-section/50 rounded-full pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Всі</option>
              <option value="new">Новий</option>
              <option value="in_progress">В роботі</option>
              <option value="resolved">Вирішено</option>
              <option value="closed">Закрито</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <Filter className="h-4 w-4 text-tg-theme-hint" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={showArchived ? 'archive' : 'requests'}
          onChange={(tabId) => setShowArchived(tabId === 'archive')}
          className="mb-4"
        />
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
                <p className="text-lg font-medium mb-1">
                  {showArchived ? 'Архів порожній' : 'Немає запитів'}
                </p>
                <p className="text-tg-theme-hint text-sm mb-4">
                  {showArchived 
                    ? 'У вас немає архівованих запитів' 
                    : 'Створіть свій перший запит для підтримки'}
                </p>
                {!showArchived && (
                  <Button
                    onClick={() => router.push('/requests/new')}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Створити запит
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="w-full bg-tg-theme-section/50 backdrop-blur-lg rounded-2xl p-4 text-left transition-all hover:bg-tg-theme-section"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 
                      className="font-medium line-clamp-1 mb-1.5 cursor-pointer"
                      onClick={() => router.push(`/requests/${request.id}`)}
                    >
                      {request.title}
                    </h3>
                    <div className="flex items-center gap-2">
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
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-tg-theme-hint hover:text-white hover:bg-tg-theme-button/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/requests/edit/${request.id}`);
                          }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full text-tg-theme-hint hover:text-red-500 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRequestToDelete(request.id);
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-tg-theme-bg/95 backdrop-blur-xl border-tg-theme-section">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl">Видалити запит?</AlertDialogTitle>
                              <AlertDialogDescription className="text-tg-theme-hint">
                                Ця дія не може бути скасована. Запит буде видалено назавжди.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-tg-theme-section/50 border-0 hover:bg-tg-theme-section">
                                Скасувати
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}
                                className="bg-red-500 hover:bg-red-600"
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Видалення...' : 'Видалити'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p 
                      className="text-sm text-tg-theme-hint line-clamp-2 cursor-pointer"
                      onClick={() => router.push(`/requests/${request.id}`)}
                    >
                      {request.description}
                    </p>
                  </div>
                </div>

                <Separator className="my-3 bg-tg-theme-button/50" />

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 text-tg-theme-hint">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    {request.media_urls.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Paperclip size={14} className="rotate-45" />
                        {request.media_urls.length}
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push(`/requests/${request.id}`)}
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
              </div>
            ))}
          </div>
        )}
        
        {/* Додаємо відступ внизу для нижньої навігаційної панелі */}
        <div className="h-20"></div>
      </div>

      <BottomNav 
        onArchiveClick={() => setShowArchived(!showArchived)}
        isArchiveActive={showArchived}
      />
    </div>
  );
} 