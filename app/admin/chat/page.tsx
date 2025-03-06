'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Chat, Request, User } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Search, 
  User2, 
  Clock, 
  ChevronRight,
  ArrowLeft,
  Filter,
  AlertCircle
} from 'lucide-react';

export default function AdminChatPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'superadmin'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchChats();
    }
  }, [user, filterStatus]);

  const fetchChats = async () => {
    try {
      // Отримуємо всі запити
      let query = supabase
        .from('requests')
        .select('id, title, user_id, status');
      
      // Фільтруємо за статусом, якщо потрібно
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data: requests, error: requestsError } = await query;

      if (requestsError) throw requestsError;

      // Для кожного запиту отримуємо останнє повідомлення та інформацію про користувача
      const chatsData: Chat[] = [];
      
      for (const request of requests) {
        // Отримуємо останнє повідомлення
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', request.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) throw messagesError;

        // Отримуємо інформацію про користувача
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, photo_url, dealer_center, city')
          .eq('id', request.user_id)
          .single();

        if (userError) throw userError;

        // Отримуємо кількість непрочитаних повідомлень для адміністратора
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('request_id', request.id)
          .eq('is_read', false)
          .not('user_id', 'eq', user?.id);

        if (countError) throw countError;

        // Додаємо чат до списку (навіть якщо немає повідомлень)
        chatsData.push({
          request_id: request.id,
          request_title: request.title,
          last_message: messages && messages.length > 0 ? messages[0].content : 'Немає повідомлень',
          last_message_time: messages && messages.length > 0 ? new Date(messages[0].created_at) : new Date(0),
          unread_count: count || 0,
          participants: [request.user_id, user?.id || ''],
          user_name: userData.name,
          user_photo: userData.photo_url,
          dealer_center: userData.dealer_center,
          city: userData.city,
          status: request.status
        });
      }

      // Сортуємо чати за часом останнього повідомлення
      chatsData.sort((a, b) => b.last_message_time.getTime() - a.last_message_time.getTime());
      
      setChats(chatsData);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) => 
    (chat.request_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
     chat.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     chat.dealer_center?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     chat.city?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/10 text-blue-500';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'resolved':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Новий';
      case 'in_progress':
        return 'В роботі';
      case 'resolved':
        return 'Вирішено';
      default:
        return 'Закрито';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white pt-5">
      <div className="bg-tg-theme-bg/80 backdrop-blur-lg p-4 sticky top-0 z-10 safe-top">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-tg-theme-button/50"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="h-5 w-5 text-tg-theme-hint" />
          </Button>
          <div className="text-xl font-semibold">Чати з користувачами</div>
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

        {/* Пошук */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tg-theme-hint" />
          <input
            type="text"
            placeholder="Пошук за запитом, користувачем, дилерським центром..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-tg-theme-section/50 backdrop-blur-sm rounded-lg pl-10 pr-4 py-2 text-sm border-0 focus:ring-2 focus:ring-blue-500/50 placeholder-tg-theme-hint"
          />
        </div>

        {/* Фільтр за статусом */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full whitespace-nowrap ${
              filterStatus === 'all' ? 'bg-tg-theme-button text-white' : 'text-tg-theme-hint'
            }`}
            onClick={() => setFilterStatus('all')}
          >
            Всі запити
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full whitespace-nowrap ${
              filterStatus === 'new' ? 'bg-blue-500/20 text-blue-500' : 'text-tg-theme-hint'
            }`}
            onClick={() => setFilterStatus('new')}
          >
            Нові
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full whitespace-nowrap ${
              filterStatus === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' : 'text-tg-theme-hint'
            }`}
            onClick={() => setFilterStatus('in_progress')}
          >
            В роботі
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full whitespace-nowrap ${
              filterStatus === 'resolved' ? 'bg-green-500/20 text-green-500' : 'text-tg-theme-hint'
            }`}
            onClick={() => setFilterStatus('resolved')}
          >
            Вирішені
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full whitespace-nowrap ${
              filterStatus === 'closed' ? 'bg-gray-500/20 text-gray-500' : 'text-tg-theme-hint'
            }`}
            onClick={() => setFilterStatus('closed')}
          >
            Закриті
          </Button>
        </div>
      </div>

      {/* Список чатів */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="bg-tg-theme-section/50 backdrop-blur-lg rounded-2xl p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-tg-theme-button/30 rounded-full p-4 mb-4">
                <MessageCircle className="h-8 w-8 text-tg-theme-button-text" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Немає запитів</h3>
              <p className="text-tg-theme-hint mb-6">
                {searchQuery 
                  ? 'За вашим запитом нічого не знайдено. Спробуйте змінити параметри пошуку.' 
                  : 'Поки немає запитів від користувачів.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => (
              <div
                key={chat.request_id}
                onClick={() => router.push(`/admin/chat/${chat.request_id}`)}
                className="w-full bg-tg-theme-section/50 backdrop-blur-lg rounded-2xl p-4 text-left transition-all hover:bg-tg-theme-section hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {chat.user_photo ? (
                      <img
                        src={chat.user_photo}
                        alt={chat.user_name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-tg-theme-button/30 flex items-center justify-center">
                        <User2 className="h-6 w-6 text-tg-theme-button-text" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium line-clamp-1">
                          {chat.user_name || 'Користувач'}
                        </h3>
                        <p className="text-xs text-tg-theme-hint mb-1">
                          {chat.dealer_center} {chat.city ? `(${chat.city})` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-tg-theme-hint mb-1 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {chat.last_message_time.getTime() > 0 
                            ? chat.last_message_time.toLocaleDateString() 
                            : ''}
                        </div>
                        {chat.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1">
                      <h4 className="text-sm font-medium line-clamp-1">
                        {chat.request_title}
                      </h4>
                      <p className="text-sm text-tg-theme-hint line-clamp-1 mt-0.5">
                        {chat.last_message}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator className="my-3 bg-tg-theme-button/50" />
                <div className="flex justify-between items-center">
                  <div className="text-xs text-tg-theme-hint">
                    Запит #{chat.request_id.slice(0, 8)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                      {getStatusText(chat.status)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-tg-theme-hint" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 