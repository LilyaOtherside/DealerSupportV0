'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Request, Message } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send, 
  Loader2
} from 'lucide-react';

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading, params.id]);

  // Прокручуємо до останнього повідомлення при завантаженні або отриманні нового
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Отримуємо запит
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (requestError) {
        console.error('Error fetching request:', requestError);
        setError('Не вдалося завантажити запит');
        return;
      }
      
      setRequest(requestData as Request);
      
      // Отримуємо повідомлення
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', params.id)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setError('Не вдалося завантажити повідомлення');
        return;
      }
      
      setMessages(messagesData as Message[]);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Сталася помилка при завантаженні даних');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !request || isSending) return;
    
    setIsSending(true);
    
    try {
      // Відправляємо повідомлення
      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: params.id,
          user_id: user.id,
          sender_name: user.name,
          sender_photo: user.photo_url,
          sender_role: user.role,
          content: newMessage.trim(),
          is_read: false
        });
      
      if (error) throw error;
      
      // Очищаємо поле введення
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Помилка при відправці повідомлення');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-tg-theme-hint">Завантаження...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData}>Спробувати знову</Button>
        <Button variant="ghost" onClick={() => router.back()} className="mt-2">
          Повернутися назад
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-tg-theme-hint mb-4">Запит не знайдено</p>
        <Button onClick={() => router.back()}>Повернутися назад</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-tg-theme-bg">
      {/* Верхня панель */}
      <div className="bg-tg-theme-section/80 backdrop-blur-lg p-3 flex items-center sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-medium">{request.title}</h1>
          <p className="text-xs text-tg-theme-hint">
            {request.status === 'new' ? 'Новий' :
             request.status === 'in_progress' ? 'В роботі' :
             request.status === 'resolved' ? 'Вирішено' : 'Закрито'}
          </p>
        </div>
      </div>

      {/* Повідомлення */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-tg-theme-hint">
            <p>Немає повідомлень</p>
            <p className="text-sm">Напишіть перше повідомлення</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.user_id === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-tg-theme-section text-white'
                }`}
              >
                {message.user_id !== user?.id && (
                  <div className="font-medium text-sm mb-1">
                    {message.sender_name}
                  </div>
                )}
                <div>{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.user_id === user?.id ? 'text-blue-100' : 'text-tg-theme-hint'
                }`}>
                  {formatMessageTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле введення */}
      <div className="bg-tg-theme-section/80 backdrop-blur-lg p-3 sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введіть повідомлення..."
            className="flex-1 bg-tg-theme-section/50 backdrop-blur-sm border-0 min-h-[40px] max-h-[120px] focus:ring-2 focus:ring-blue-500/50 resize-none py-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-tg-theme-hint hover:text-white hover:bg-tg-theme-button/50"
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 