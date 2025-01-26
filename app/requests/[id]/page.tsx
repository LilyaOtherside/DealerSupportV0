'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Request } from '@/app/types';
import Image from 'next/image';

export default function RequestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!request || !confirm('Ви впевнені, що хочете видалити цей запит?')) return;

    setIsDeleting(true);
    try {
      // Видаляємо медіа файли
      if (request.media_urls.length > 0) {
        const filesToDelete = request.media_urls.map(media => {
          const url = new URL(media.url);
          return url.pathname.split('/').pop()!;
        });

        const { error: storageError } = await supabase.storage
          .from('request-media')
          .remove(filesToDelete);

        if (storageError) throw storageError;
      }

      // Видаляємо запит
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', request.id);

      if (error) throw error;

      router.push('/requests');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Помилка при видаленні запиту');
    } finally {
      setIsDeleting(false);
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
    <div className="min-h-screen bg-tg-theme-bg text-white">
      {/* Верхня панель */}
      <div className="bg-tg-theme-section p-4 flex justify-between items-center safe-top">
        <button 
          onClick={() => router.back()}
          className="text-tg-theme-hint"
        >
          ← Назад
        </button>
        <div className="text-lg font-medium">
          {isEditing ? 'Редагування' : 'Перегляд запиту'}
        </div>
        <button
          onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
          className="text-blue-500"
        >
          {isEditing ? 'Зберегти' : 'Редагувати'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {isEditing ? (
          // Форма редагування
          <>
            <div>
              <label className="block text-sm text-tg-theme-hint mb-2">
                Тема запиту
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-tg-theme-section rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-tg-theme-hint mb-2">
                Опис проблеми
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-tg-theme-section rounded-lg text-white min-h-[120px]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-tg-theme-hint mb-2">
                Пріоритет
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-2 rounded-lg ${
                      priority === p 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-tg-theme-section text-tg-theme-hint'
                    }`}
                  >
                    {p === 'low' ? 'Низький' : p === 'medium' ? 'Середній' : 'Високий'}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Перегляд запиту
          <>
            <div className="flex justify-between items-start">
              <h1 className="text-xl font-medium">{request.title}</h1>
              <span className={`text-xs px-2 py-1 rounded ${
                request.priority === 'high' 
                  ? 'bg-red-500' 
                  : request.priority === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}>
                {request.priority === 'low' ? 'Низький' : 
                 request.priority === 'medium' ? 'Середній' : 'Високий'}
              </span>
            </div>

            <p className="text-tg-theme-hint">{request.description}</p>

            {request.media_urls.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm text-tg-theme-hint">Медіа файли:</h2>
                <div className="grid grid-cols-3 gap-2">
                  {request.media_urls.map((media, index) => (
                    <div key={index} className="relative aspect-square">
                      {media.type === 'image' ? (
                        <Image
                          src={media.url}
                          alt="Media"
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-tg-theme-section rounded-lg flex items-center justify-center">
                          {media.type === 'video' ? '🎥' : '📄'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between text-sm text-tg-theme-hint">
              <span>Створено: {new Date(request.created_at).toLocaleDateString()}</span>
              <span>Статус: {request.status}</span>
            </div>
          </>
        )}

        {!isEditing && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full p-4 mt-4 rounded-lg bg-red-500 text-white font-medium"
          >
            {isDeleting ? 'Видалення...' : 'Видалити запит'}
          </button>
        )}
      </div>
    </div>
  );
} 