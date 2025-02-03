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

          // Визначаємо тип файлу за розширенням
          const fileType: MediaFile['type'] = 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name) ? 'image' :
            /\.(mp4|webm|mov)$/i.test(file.name) ? 'video' :
            'document';

          return {
            url: publicUrl,
            type: fileType
          };
        })
      );

      const updatedFiles = [...files, ...newMediaUrls];
      
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          media_urls: updatedFiles,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .single();
      
      if (updateError) throw updateError;
      
      onUpdate(updatedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Помилка при завантаженні файлів');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileUrl: string, index: number) => {
    try {
      if (!fileUrl || !files[index]) {
        throw new Error('URL файлу відсутній');
      }
      
      const urlParts = fileUrl.split('request-media/');
      if (urlParts.length < 2) {
        throw new Error('Неправильний формат URL файлу');
      }
      
      const filePath = urlParts[1].split('?')[0];
      
      console.log('Deleting file:', filePath);
      
      if (!filePath) {
        throw new Error('Неправильний шлях до файлу');
      }

      const { error: deleteError } = await supabase.storage
        .from('request-media')
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        throw deleteError;
      }

      const newFiles = files.filter((_, i) => i !== index);
      
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          media_urls: newFiles,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .single();
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }
      
      onUpdate(newFiles);
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Помилка при видаленні файлу');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-tg-theme-hint">
          <Paperclip size={16} className="rotate-45" />
          <span>Вкладення ({files?.length || 0})</span>
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
        {files?.map((file, index) => {
          // Визначаємо тип файлу за URL, якщо тип не вказано
          const fileType = file.type || (
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url) ? 'image' :
            /\.(mp4|webm|mov)$/i.test(file.url) ? 'video' :
            'document'
          );

          return (
            <div
              key={file.url + index}
              className="relative group rounded-lg overflow-hidden bg-tg-theme-section/50 backdrop-blur-sm w-[160px]"
            >
              {fileType === 'image' ? (
                <div className="aspect-square relative">
                  <Image
                    src={file.url || ''}
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
                    {fileType === 'video' ? '🎥' : '📄'}
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
                    if (file?.url) window.open(file.url, '_blank');
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
                    if (file?.url) handleDelete(file.url, index);
                  }}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 