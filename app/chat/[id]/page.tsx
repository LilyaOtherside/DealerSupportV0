'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Request, Message, User, MediaFile } from '@/app/types';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from 'next/image';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  FileVideo,
  File,
  X,
  Info,
  Mic,
  Square,
  Play,
  Pause,
  Clock,
  Check,
  CheckCheck
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
        // Зупиняємо запис, якщо він активний
        if (isRecording) {
          stopRecording();
        }
        // Очищаємо URL об'єкти
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    }
  }, [user, params.id]);

  // Прокручуємо до останнього повідомлення при завантаженні або отриманні нового
  useEffect(() => {
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

  // Ефект для оновлення часу запису
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const fetchRequestAndMessages = async () => {
    try {
      setIsLoading(true);
      
      // Отримуємо запит
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (requestError) {
        console.error('Error fetching request:', requestError);
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
        return;
      }
      
      setMessages(messagesData as Message[]);
    } catch (error) {
      console.error('Error in fetchRequestAndMessages:', error);
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
    if ((!newMessage.trim() && mediaFiles.length === 0 && !audioBlob) || !user || !request) return;
    
    setIsSending(true);
    
    try {
      let attachments: MediaFile[] = [...mediaFiles];
      
      // Якщо є аудіо, завантажуємо його
      if (audioBlob) {
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { 
          type: 'audio/webm' 
        });
        
        const { data: audioData, error: audioError } = await supabase.storage
          .from('attachments')
          .upload(`voice/${user.id}/${Date.now()}_${audioFile.name}`, audioFile);
        
        if (audioError) throw audioError;
        
        const audioUrl = supabase.storage
          .from('attachments')
          .getPublicUrl(audioData.path).data.publicUrl;
        
        attachments.push({
          url: audioUrl,
          type: 'audio',
          name: 'Голосове повідомлення',
          originalName: audioFile.name
        });
      }
      
      // Відправляємо повідомлення
      const { data, error } = await supabase
        .from('messages')
        .insert({
          request_id: params.id,
          user_id: user.id,
          sender_name: user.name,
          sender_photo: user.photo_url,
          sender_role: user.role,
          content: newMessage.trim() || (audioBlob ? '🎤 Голосове повідомлення' : '📎 Вкладення'),
          attachments: attachments.length > 0 ? attachments : null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Оновлюємо запит (дата оновлення)
      await supabase
        .from('requests')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', params.id);
      
      // Очищаємо поле введення та медіафайли
      setNewMessage('');
      setMediaFiles([]);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Помилка при відправці повідомлення');
    } finally {
      setIsSending(false);
      setShowAttachMenu(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (file.size > maxSize) {
      alert('Файл занадто великий. Максимальний розмір: 20MB');
      return;
    }
    
    try {
      // Визначаємо тип файлу
      let fileType: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      
      // Завантажуємо файл
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(`${fileType}/${user?.id}/${Date.now()}_${file.name}`, file);
      
      if (error) throw error;
      
      // Отримуємо публічне посилання
      const url = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path).data.publicUrl;
      
      // Додаємо файл до списку
      setMediaFiles(prev => [...prev, {
        url,
        type: fileType,
        name: file.name,
        originalName: file.name
      }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Помилка при завантаженні файлу');
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

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Зупиняємо всі треки
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Помилка при запуску запису аудіо');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Очищаємо аудіо
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioBlob(null);
      setAudioUrl(null);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white flex flex-col items-center justify-center p-4">
        <Info className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Запит не знайдено</h1>
        <p className="text-center text-tg-theme-hint mb-6">
          Запит не існує або був видалений
        </p>
        <Button
          onClick={() => router.push('/chat')}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Повернутися до чатів
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white flex flex-col">
      {/* Верхня панель */}
      <div className="bg-tg-theme-section/80 backdrop-blur-lg p-4 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => router.push('/chat')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-medium line-clamp-1">{request.title}</h1>
          <p className="text-xs text-tg-theme-hint">
            {request.status === 'new' ? 'Новий запит' :
             request.status === 'in_progress' ? 'В роботі' :
             request.status === 'resolved' ? 'Вирішено' : 'Закрито'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => router.push(`/requests/${request.id}`)}
        >
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Повідомлення */}
      <div 
        className="flex-1 p-4 overflow-y-auto" 
        ref={messagesContainerRef}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="bg-tg-theme-button/30 rounded-full p-4 mb-4">
              <MessageCircle className="h-8 w-8 text-tg-theme-button-text" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Немає повідомлень</h3>
            <p className="text-tg-theme-hint mb-6">
              Напишіть перше повідомлення, щоб почати спілкування
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.user_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-tg-theme-section text-white'
                  }`}
                >
                  {message.user_id !== user?.id && (
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender_photo ? (
                        <img
                          src={message.sender_photo}
                          alt={message.sender_name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-tg-theme-button flex items-center justify-center text-xs">
                          {message.sender_name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-medium">
                        {message.sender_name}
                      </span>
                    </div>
                  )}
                  
                  {/* Текст повідомлення */}
                  {message.content && (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  
                  {/* Вкладення */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="rounded-lg overflow-hidden">
                          {attachment.type === 'image' ? (
                            <div className="relative aspect-video">
                              <img
                                src={attachment.url}
                                alt=""
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                            </div>
                          ) : attachment.type === 'video' ? (
                            <video
                              src={attachment.url}
                              controls
                              className="w-full rounded-lg"
                            />
                          ) : attachment.type === 'audio' ? (
                            <div className="bg-tg-theme-bg/30 rounded-lg p-2 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-tg-theme-button/50"
                                onClick={() => {
                                  const audio = new Audio(attachment.url);
                                  audio.play();
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <div className="flex-1">
                                <div className="h-1 bg-tg-theme-button/50 rounded-full">
                                  <div className="h-full w-0 bg-blue-500 rounded-full" />
                                </div>
                              </div>
                              <span className="text-xs text-tg-theme-hint">
                                00:00
                              </span>
                            </div>
                          ) : (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-tg-theme-bg/30 rounded-lg p-2 flex items-center gap-2"
                            >
                              <div className="bg-tg-theme-button/50 rounded-lg p-2">
                                <File className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {attachment.name || attachment.originalName || 'Файл'}
                                </p>
                                <p className="text-xs text-tg-theme-hint">
                                  Натисніть, щоб завантажити
                                </p>
                              </div>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Час та статус */}
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    message.user_id === user?.id ? 'text-blue-100' : 'text-tg-theme-hint'
                  }`}>
                    <span>{formatMessageTime(message.created_at)}</span>
                    {message.user_id === user?.id && (
                      message.is_read ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Поле введення */}
      <div className="bg-tg-theme-section/80 backdrop-blur-lg p-3 sticky bottom-0 z-10">
        {isRecording ? (
          <div className="flex items-center gap-2 bg-tg-theme-bg/50 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">
              {formatRecordingTime(recordingTime)}
            </span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-red-500 hover:bg-red-500/20"
              onClick={cancelRecording}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-tg-theme-button/50"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        ) : audioBlob ? (
          <div className="flex items-center gap-2 bg-tg-theme-bg/50 backdrop-blur-sm rounded-full px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-tg-theme-button/50"
              onClick={toggleAudioPlayback}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="h-1 flex-1 bg-tg-theme-button/50 rounded-full">
              <div className="h-full w-0 bg-blue-500 rounded-full" />
            </div>
            <audio ref={audioRef} src={audioUrl || ''} onEnded={handleAudioEnded} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-red-500 hover:bg-red-500/20"
              onClick={() => {
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                }
                setAudioBlob(null);
                setAudioUrl(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-tg-theme-hint hover:text-white hover:bg-tg-theme-button/50"
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-tg-theme-hint hover:text-white hover:bg-tg-theme-button/50"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            {/* Меню вкладень */}
            {showAttachMenu && (
              <div className="absolute bottom-20 left-4 bg-tg-theme-bg/95 backdrop-blur-lg rounded-lg p-2 shadow-lg">
                <div className="flex flex-col gap-2">
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
            
            {/* Кнопка запису голосового повідомлення */}
            {!newMessage.trim() && mediaFiles.length === 0 && !audioBlob && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-tg-theme-hint hover:text-white hover:bg-tg-theme-button/50"
                onClick={startRecording}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            
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
              disabled={isSending || (!newMessage.trim() && mediaFiles.length === 0 && !audioBlob)}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 