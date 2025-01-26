'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type Priority = 'low' | 'medium' | 'high';
type MediaFile = {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
};

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: MediaFile[] = Array.from(files).map(file => {
      const type = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
        ? 'video' 
        : 'document';

      return {
        file,
        preview: type === 'image' ? URL.createObjectURL(file) : '',
        type
      };
    });

    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Перевіряємо розмір файлу (наприклад, до 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Файл занадто великий (максимум 10MB)');
      }

      const { error: uploadError, data } = await supabase.storage
        .from('request-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('request-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Завантажуємо всі файли
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (media, index) => {
          try {
            const url = await uploadFile(media.file);
            setUploadProgress(((index + 1) / mediaFiles.length) * 100);
            return {
              url,
              type: media.type
            };
          } catch (error) {
            console.error(`Error uploading file ${index}:`, error);
            throw error;
          }
        })
      );

      // Створюємо запит
      const { error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          title,
          description,
          priority,
          status: 'new',
          media_urls: mediaUrls
        });

      if (error) {
        console.error('Error creating request:', error);
        throw error;
      }

      router.push('/requests');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert(`Помилка при створенні запиту: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

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
        <div className="text-lg font-medium">Новий запит</div>
        <div className="w-10"></div>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-tg-theme-hint mb-2">
            Тема запиту
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-tg-theme-section rounded-lg text-white"
            placeholder="Введіть тему запиту"
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
            placeholder="Опишіть вашу проблему детально"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-tg-theme-hint mb-2">
            Пріоритет
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
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

        {/* Медіа файли */}
        <div>
          <label className="block text-sm text-tg-theme-hint mb-2">
            Медіа файли
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {mediaFiles.map((media, index) => (
              <div key={index} className="relative">
                {media.type === 'image' ? (
                  <div className="aspect-square relative">
                    <Image
                      src={media.preview}
                      alt="Preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-tg-theme-section rounded-lg flex items-center justify-center">
                    {media.type === 'video' ? '🎥' : '📄'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-tg-theme-section rounded-lg flex items-center justify-center text-2xl text-tg-theme-hint"
            >
              +
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {uploadProgress > 0 && (
          <div className="w-full bg-tg-theme-section rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-4 rounded-lg bg-blue-500 text-white font-medium ${
            isSubmitting ? 'opacity-50' : ''
          }`}
        >
          {isSubmitting ? 'Створення...' : 'Створити запит'}
        </button>
      </form>
    </div>
  );
} 