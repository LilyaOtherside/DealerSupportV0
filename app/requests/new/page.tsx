'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  FileVideo,
  File,
  Loader2
} from 'lucide-react';

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
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Файл занадто великий (максимум 10MB)');
      }

      const { error: uploadError } = await supabase
        .storage
        .from('request-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase
        .storage
        .from('request-media')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error('Не вдалося отримати public URL для файлу');
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.log('User not authenticated:', user);
      alert('Користувач не авторизований');
      return;
    }
    console.log('Authenticated user:', user.id);
    setIsSubmitting(true);

    try {
      // Завантажуємо медіафайли
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (file) => {
          const fileName = `${user.id}/${Date.now()}_${file.file.name}`;
          const { data, error } = await supabase.storage
            .from('request-media')
            .upload(fileName, file.file, {
              upsert: false,
              cacheControl: '3600',
              contentType: file.file.type
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('request-media')
            .getPublicUrl(fileName);

          return {
            url: publicUrl,
            type: file.type
          };
        })
      );

      // Створюємо запит
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            user_id: user.id,
            title,
            description,
            priority,
            status: 'new',
            media_urls: mediaUrls
          }
        ])
        .select('*')
        .single();

      console.log('Request data:', {
        user_id: user.id,
        title,
        description,
        priority,
        status: 'new',
        media_urls: mediaUrls
      });

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      router.push('/requests');
    } catch (error) {
      console.error('Error creating request:', error);
      if (error instanceof Error) {
        alert('Помилка при створенні запиту: ' + error.message);
      } else {
        alert('Помилка при створенні запиту: ' + JSON.stringify(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="text-xl font-semibold">Новий запит</div>
          <div className="w-10" />
        </div>
      </div>

      {/* Форма */}
      <form onSubmit={createRequest} className="p-4 space-y-6">
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
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Медіа файли
            </label>
            <div className="grid grid-cols-4 gap-2">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative aspect-square group">
                  {media.type === 'image' ? (
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <Image
                        src={media.preview}
                        alt="Preview"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-tg-theme-section/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      {media.type === 'video' ? (
                        <FileVideo className="h-6 w-6 text-tg-theme-hint" />
                      ) : (
                        <File className="h-6 w-6 text-tg-theme-hint" />
                      )}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="aspect-square bg-tg-theme-section/50 backdrop-blur-sm border-2 border-dashed border-tg-theme-button hover:border-blue-500 hover:bg-tg-theme-section transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6" />
              </Button>
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
        </div>

        {uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Завантаження файлів...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress 
              value={uploadProgress} 
              className="bg-tg-theme-section/50 h-2"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 transition-colors h-12 text-base font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Створення...
            </>
          ) : (
            'Створити запит'
          )}
        </Button>
      </form>
    </div>
  );
} 