'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Request, Message, User, MediaFile } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  FileVideo,
  File,
  X,
  Info
} from 'lucide-react';

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchRequestAndMessages();
      
      // Підписуємося на нові повідомлення
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `request_id=eq.${params.id}`
        }, (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Позначаємо повідомлення як прочитане, якщо воно не від поточного користувача
          if (newMessage.user_id !== user.id) {
            markMessageAsRead(newMessage.id);
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, params.id]);

  useEffect(() => {
    // Прокручуємо до останнього повідомлення при завантаженні або отриманні нового
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Позначаємо всі повідомлення як прочитані
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(
        msg => !msg.is_read && msg.user_id !== user.id
      );
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => markMessageAsRead(msg.id));
      }
    }
  }, [messages]);

  const fetchRequestAndMessages = async () => {
    try {
      // Отримуємо інформацію про запит
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', params.id)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData as Request);

      // Отримуємо повідомлення
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', params.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData as Message[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && mediaFiles.length === 0) return;
    if (!user) return;
    
    setIsSending(true);
    
    try {
      const newMessageData = {
        request_id: params.id,
        user_id: user.id,
        sender_name: user.name,
        sender_photo: user.photo_url || null,
        sender_role: user.role,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
        attachments: mediaFiles.length > 0 ? mediaFiles : null
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessageData)
        .select();
      
      if (error) throw error;
      
      // Очищаємо поле введення та медіафайли
      setNewMessage('');
      setMediaFiles([]);
      setShowAttachMenu(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Помилка при відправці повідомлення');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.split('/')[0];
      let type: 'image' | 'video' | 'document' = 'document';
      
      if (fileType === 'image') type = 'image';
      else if (fileType === 'video') type = 'video';
      
      // Створюємо URL для попереднього перегляду
      const fileUrl = URL.createObjectURL(file);
      
      // Додаємо файл до списку
      setMediaFiles(prev => [...prev, {
        url: fileUrl,
        type,
        name: file.name,
        originalName: file.name
      }]);
    }
    
    // Очищаємо input для можливості повторного вибору того ж файлу
    e.target.value = '';
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-tg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white p-4">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
          <p>Запит не знайдено</p>
          <Button 
            onClick={() => router.push('/chat')}
            className="mt-4"
          >
            Повернутися до списку чатів
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white flex flex-col">
      {/* Верхня панель */}
      <div className="bg-tg-theme-bg/80 backdrop-blur-lg p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/chat')}
            className="text-tg-theme-hint hover:bg-tg-theme-button/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="text-lg font-semibold truncate">{request.title}</div>
            <div className="text-xs text-tg-theme-hint">
              Запит #{request.id.slice(0, 8)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/requests/${params.id}`)}
            className="text-tg-theme-hint hover:bg-tg-theme-button/50"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Повідомлення */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Системне повідомлення про створення запиту */}
          <div className="flex justify-center">
            <div className="bg-tg-theme-section/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-tg-theme-hint">
              Запит створено {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-tg-theme-button/30 rounded-full p-4 mb-4">
                <Send className="h-6 w-6 text-tg-theme-button-text" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Почніть спілкування</h3>
              <p className="text-tg-theme-hint max-w-xs">
                Напишіть повідомлення, щоб почати спілкування з підтримкою
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.user_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-tg-theme-section/50 backdrop-blur-sm'
                  }`}
                >
                  {message.user_id !== user?.id && (
                    <div className="flex items-center gap-2 mb-1.5">
                      {message.sender_photo ? (
                        <img
                          src={message.sender_photo}
                          alt={message.sender_name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-tg-theme-button/50 flex items-center justify-center">
                          <User2 className="w-3 h-3" />
                        </div>
                      )}
                      <div className="text-xs font-medium">
                        {message.sender_name}
                        {message.sender_role === 'admin' && (
                          <span className="ml-1 text-blue-300">(Адміністратор)</span>
                        )}
                        {message.sender_role === 'superadmin' && (
                          <span className="ml-1 text-purple-300">(Головний адміністратор)</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="text-sm">
                    {message.content}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((file, index) => (
                        <div key={index} className="rounded-lg overflow-hidden">
                          {file.type === 'image' ? (
                            <img
                              src={file.url}
                              alt={file.name || 'Image'}
                              className="max-w-full rounded-lg"
                            />
                          ) : file.type === 'video' ? (
                            <video
                              src={file.url}
                              controls
                              className="max-w-full rounded-lg"
                            />
                          ) : (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-tg-theme-bg/30 p-2 rounded-lg"
                            >
                              <File className="h-5 w-5" />
                              <span className="text-sm truncate">
                                {file.originalName || file.name || 'Файл'}
                              </span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-right mt-1">
                    <span className="text-xs opacity-70">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Форма відправки повідомлення */}
      <div className="bg-tg-theme-bg/80 backdrop-blur-lg p-4 border-t border-tg-theme-section">
        {mediaFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative">
                {file.type === 'image' ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img
                      src={file.url}
                      alt={file.name || 'Attachment'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeMediaFile(index)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : file.type === 'video' ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-tg-theme-section flex items-center justify-center">
                    <FileVideo className="h-8 w-8 text-tg-theme-hint" />
                    <button
                      onClick={() => removeMediaFile(index)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-tg-theme-section flex items-center justify-center">
                    <File className="h-8 w-8 text-tg-theme-hint" />
                    <button
                      onClick={() => removeMediaFile(index)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-tg-theme-hint hover:text-white hover:bg-tg-theme-button/50"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 bg-tg-theme-bg/95 backdrop-blur-xl rounded-lg p-2 shadow-lg">
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-tg-theme-hint hover:text-white"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/*';
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Фото</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-tg-theme-hint hover:text-white"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'video/*';
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <FileVideo className="h-4 w-4" />
                    <span>Відео</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-tg-theme-hint hover:text-white"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '*/*';
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <File className="h-4 w-4" />
                    <span>Файл</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
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
            disabled={isSending || (!newMessage.trim() && mediaFiles.length === 0)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 