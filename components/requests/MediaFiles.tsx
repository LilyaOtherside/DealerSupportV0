'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, Plus, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'document';
}

interface MediaFilesProps {
  files: MediaFile[];
  requestId: string;
  onUpdate: (newFiles: MediaFile[]) => void;
}

export function MediaFiles({ files, requestId, onUpdate }: MediaFilesProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setIsUploading(true);
    try {
      const newMediaUrls = await Promise.all(
        Array.from(selectedFiles).map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${requestId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('request-media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('request-media')
            .getPublicUrl(filePath);

          const fileType: MediaFile['type'] = file.type.startsWith('image/') 
            ? 'image' 
            : file.type.startsWith('video/') 
            ? 'video' 
            : 'document';

          return {
            url: publicUrl,
            type: fileType
          };
        })
      );

      const updatedFiles = [...files, ...newMediaUrls];
      
      const { error: updateError } = await supabase
        .from('requests')
        .update({ media_urls: updatedFiles })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      onUpdate(updatedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Помилка при завантаженні файлів');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileUrl: string, index: number) => {
    try {
      // Отримуємо повний шлях після bucket name
      const filePath = fileUrl.split('request-media/')[1]?.split('?')[0];
      
      console.log('Deleting file:', filePath);
      
      if (!filePath) {
        throw new Error('Invalid file path');
      }

      // Спочатку оновлюємо запит в базі даних
      const newFiles = files.filter((_, i) => i !== index);
      
      const { error: updateError } = await supabase
        .from('requests')
        .update({ media_urls: newFiles })
        .eq('id', requestId)
        .single();
      
      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Потім видаляємо файл зі сховища
      const { error: deleteError } = await supabase.storage
        .from('request-media')
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        // Якщо файл не вдалося видалити, але запит оновлено,
        // продовжуємо роботу і показуємо попередження
        console.warn('Failed to delete file from storage, but request was updated');
      }
      
      onUpdate(newFiles);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Помилка при видаленні файлу');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-tg-theme-hint">
          <Paperclip size={16} className="rotate-45" />
          <span>Вкладення ({files.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-blue-500 hover:bg-blue-500/10"
        >
          {isUploading ? 'Завантаження...' : (
            <>
              <Plus size={16} className="mr-1" />
              Додати файл
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {files.map((file, index) => (
          <div
            key={file.url + index}
            className="relative group rounded-lg overflow-hidden bg-tg-theme-section/50 backdrop-blur-sm w-[160px]"
          >
            {file.type === 'image' ? (
              <div className="aspect-square relative">
                <Image
                  src={file.url}
                  alt=""
                  fill
                  unoptimized
                  loading="eager"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <span className="text-2xl">
                  {file.type === 'video' ? '🎥' : '📄'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(file.url, '_blank');
                }}
              >
                <Download size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.url, index);
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 