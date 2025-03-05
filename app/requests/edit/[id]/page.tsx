'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Request } from '@/app/types';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { MediaFiles } from '@/components/requests/MediaFiles';
import { 
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  FileVideo,
  File,
  Loader2,
  Save,
  Check
} from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
type MediaFile = {
  url: string;
  type: 'image' | 'video' | 'document';
  name?: string;
  icon?: string;
  originalName?: string;
};

export default function EditRequestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Запит не знайдено');
        
        setRequest(data as Request);
        setTitle(data.title);
        setDescription(data.description);
        setPriority(data.priority as Priority);
      } catch (error) {
        console.error('Error fetching request:', error);
        setError('Не вдалося завантажити запит');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequest();
  }, [params.id, user]);

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !request) {
      alert('Користувач не авторизований або запит не знайдено');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('requests')
        .update({
          title,
          description,
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccessMessage('Запит успішно оновлено');
      
      setTimeout(() => {
        router.push(`/requests/${params.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating request:', error);
      if (error instanceof Error) {
        alert('Помилка при оновленні запиту: ' + error.message);
      } else {
        alert('Помилка при оновленні запиту');
      }
      setIsSubmitting(false);
    }
  };

  const handleMediaUpdate = (newMediaFiles: MediaFile[]) => {
    if (request) {
      setRequest({
        ...request,
        media_urls: newMediaFiles
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-tg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white p-4">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
          <p>{error || 'Запит не знайдено'}</p>
          <Button 
            onClick={() => router.push('/requests')}
            className="mt-4"
          >
            Повернутися до списку запитів
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white">
      {/* Верхня панель */}
      <div className="bg-tg-theme-bg/80 backdrop-blur-lg p-4 sticky top-0 z-10 safe-top">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-tg-theme-hint hover:bg-tg-theme-button/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-xl font-semibold">Редагування запиту</div>
          <div className="w-10" />
        </div>
      </div>

      {/* Повідомлення про успішне оновлення */}
      {successMessage && (
        <div className="fixed top-20 left-0 right-0 mx-auto w-4/5 bg-green-500/90 text-white p-3 rounded-lg z-50 flex items-center justify-center gap-2 backdrop-blur-sm">
          <Check className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleUpdateRequest} className="p-4 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Тема запиту
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-tg-theme-section/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-blue-500/50"
              placeholder="Введіть тему запиту"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Опис проблеми
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-tg-theme-section/50 backdrop-blur-sm border-0 min-h-[120px] focus:ring-2 focus:ring-blue-500/50"
              placeholder="Опишіть вашу проблему детально"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Пріоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? "default" : "secondary"}
                  onClick={() => setPriority(p)}
                  className={`
                    transition-all duration-200
                    ${priority === p 
                      ? p === 'high'
                        ? 'bg-red-500 hover:bg-red-600'
                        : p === 'medium'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                      : 'bg-tg-theme-section/50 hover:bg-tg-theme-section text-white'
                    }
                  `}
                >
                  {p === 'low' ? 'Низький' : p === 'medium' ? 'Середній' : 'Високий'}
                </Button>
              ))}
            </div>
          </div>

          {/* Медіа файли */}
          <MediaFiles 
            files={request.media_urls} 
            requestId={request.id}
            onUpdate={handleMediaUpdate}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 transition-colors h-12 text-base font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Збереження...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Зберегти зміни
            </>
          )}
        </Button>
      </form>
    </div>
  );
} 