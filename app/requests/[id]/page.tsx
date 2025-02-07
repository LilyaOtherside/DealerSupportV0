'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Request } from '@/app/types';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  Trash2,
  Clock,
  AlertCircle,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { MediaFiles } from '@/components/requests/MediaFiles';

export default function RequestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Стани для редагування
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setRequest(data as Request);
      // Встановлюємо початкові значення для редагування
      setTitle(data.title);
      setDescription(data.description);
      setPriority(data.priority);
    } catch (error) {
      console.error('Error fetching request:', error);
      alert('Помилка при завантаженні запиту');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!request) return;

    try {
      const { error } = await supabase
        .from('requests')
        .update({
          title,
          description,
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
      
      setRequest(prev => prev ? {
        ...prev,
        title,
        description,
        priority,
        updated_at: new Date()
      } : null);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Помилка при оновленні запиту');
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    
    setIsDeleting(true);
    try {
      // Спочатку видаляємо запит з бази даних
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Видаляємо медіафайли
      if (request.media_urls && request.media_urls.length > 0) {
        const filePaths = request.media_urls
          .map(file => file.url.split('request-media/')[1]?.split('?')[0])
          .filter(Boolean);
        
        console.log('Deleting files:', filePaths);
        
        if (filePaths.length > 0) {
          await Promise.allSettled(
            filePaths.map(path =>
              supabase.storage
                .from('request-media')
                .remove([path])
            )
          );
        }
      }

      router.push('/requests');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Помилка при видаленні запиту');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!request) return;
    
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          is_archived: !request.is_archived,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      setRequest({
        ...request,
        is_archived: !request.is_archived
      });

    } catch (error) {
      console.error('Error toggling archive status:', error);
      alert('Помилка при зміні статусу архівації');
    } finally {
      setIsArchiving(false);
    }
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
      <div className="min-h-screen bg-tg-theme-bg text-white p-4">
        <div className="text-center">Запит не знайдено</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-tg-theme-bg to-tg-theme-section text-white">
      {/* Верхня панель */}
      <div className="bg-tg-theme-bg/80 backdrop-blur-lg p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-tg-theme-button/50"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-lg font-medium">Запит #{request.id.slice(0, 8)}</div>
        </div>
      </div>

      {/* Основний контент */}
      <div className="p-4 space-y-4">
        {/* Заголовок та пріоритет */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-xl font-semibold">{request.title}</h1>
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
          <p className="text-tg-theme-hint whitespace-pre-wrap break-words">
            {request.description}
          </p>
        </div>

        <Separator className="bg-tg-theme-button/50" />

        {/* Інформація про запит */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-tg-theme-hint">Статус</span>
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
          </div>
          <div className="flex items-center text-tg-theme-hint">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(request.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Медіафайли */}
        <MediaFiles
          files={request.media_urls}
          requestId={request.id}
          onUpdate={newFiles => {
            setRequest({ ...request, media_urls: newFiles });
          }}
        />
      </div>

      {!isEditing && (
        <div className="flex gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
                className="flex-1 h-12 text-base font-medium"
              disabled={isDeleting}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {isDeleting ? 'Видалення...' : 'Видалити запит'}
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
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Видалити
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          <Button
            variant="outline"
            className="flex-1 h-12 text-base font-medium bg-white hover:bg-gray-100 text-gray-900"
            onClick={handleArchiveToggle}
            disabled={isArchiving}
          >
            {request?.is_archived ? (
              <>
                <ArchiveRestore className="w-5 h-5 mr-2" />
                {isArchiving ? 'Відновлення...' : 'Відновити з архіву'}
              </>
            ) : (
              <>
                <Archive className="w-5 h-5 mr-2" />
                {isArchiving ? 'Архівація...' : 'Додати в архів'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 