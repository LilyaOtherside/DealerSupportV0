'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Chat, Request } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Search, 
  User2, 
  Clock, 
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { BottomNav } from "@/components/BottomNav";

export default function ChatPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchChats();
      
      // Підписуємося на зміни в повідомленнях
      const subscription = supabase
        .channel('chat_updates')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, () => {
          fetchChats();
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'requests',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchChats();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      // Отримуємо всі запити користувача, які не архівовані
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Для кожного запиту отримуємо останнє повідомлення
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

        // Отримуємо кількість непрочитаних повідомлень
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('request_id', request.id)
          .eq('is_read', false)
          .not('user_id', 'eq', user?.id);

        if (countError) throw countError;

        // Отримуємо інформацію про адміністратора, якщо запит в роботі
        let adminName = '';
        if (request.status === 'in_progress' && request.assigned_admin_id) {
          const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('name')
            .eq('id', request.assigned_admin_id)
            .single();
          
          if (!adminError && adminData) {
            adminName = adminData.name;
          }
        }

        // Додаємо чат до списку
        chatsData.push({
          request_id: request.id,
          request_title: request.title,
          last_message: messages && messages.length > 0 
            ? messages[0].content 
            : 'Немає повідомлень',
          last_message_time: messages && messages.length > 0 
            ? new Date(messages[0].created_at) 
            : new Date(request.updated_at),
          unread_count: count || 0,
          participants: [user?.id || ''],
          status: request.status,
          admin_name: adminName
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
    chat.request_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string, adminName: string = '') => {
    switch (status) {
      case 'new':
        return 'Новий запит';
      case 'in_progress':
        return adminName ? `В роботі (${adminName})` : 'В роботі';
      case 'resolved':
        return 'Вирішено';
      default:
        return 'Закрито';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white">
      <div className="sticky top-0 z-10 bg-tg-theme-bg/80 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => router.push('/requests')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-xl font-semibold">Повідомлення</div>
          <div className="w-10"></div>
        </div>

        {/* Пошук */}
        <div className="relative px-4 mb-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-tg-theme-hint" />
          <input
            type="text"
            placeholder="Пошук повідомлень..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-tg-theme-section/50 backdrop-blur-sm rounded-lg pl-10 pr-4 py-2 text-sm border-0 focus:ring-2 focus:ring-blue-500/50 placeholder-tg-theme-hint"
          />
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
              <h3 className="text-xl font-semibold mb-2">Немає повідомлень</h3>
              <p className="text-tg-theme-hint mb-6">
                {searchQuery 
                  ? 'За вашим запитом нічого не знайдено.' 
                  : 'У вас поки немає активних чатів. Створіть запит, щоб почати спілкування з підтримкою.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/requests/new')}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Створити запит
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => (
              <div
                key={chat.request_id}
                onClick={() => router.push(`/chat/${chat.request_id}`)}
                className="w-full bg-tg-theme-section/50 backdrop-blur-lg rounded-2xl p-4 text-left transition-all hover:bg-tg-theme-section hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(chat.status)}
                    <div>
                      <h3 className="font-medium line-clamp-1">
                        {chat.request_title}
                      </h3>
                      <p className="text-xs text-tg-theme-hint">
                        {getStatusText(chat.status, chat.admin_name)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-tg-theme-hint mb-1 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {chat.last_message_time.toLocaleDateString()}
                    </div>
                    {chat.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-tg-theme-hint line-clamp-1 mt-2">
                  {chat.last_message}
                </p>
                <Separator className="my-3 bg-tg-theme-button/50" />
                <div className="flex justify-between items-center">
                  <div className="text-xs text-tg-theme-hint">
                    Запит #{chat.request_id.slice(0, 8)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-tg-theme-hint" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Додаємо відступ внизу для нижньої навігаційної панелі */}
        <div className="h-20"></div>
      </div>

      <BottomNav 
        onArchiveClick={() => {}}
        isArchiveActive={false}
      />
    </div>
  );
} 