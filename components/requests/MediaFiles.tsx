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
          const fileName = `${Date.now()}_${file.name}`;
          const { error } = await supabase.storage
            .from('request-media')
            .upload(`${requestId}/${fileName}`, file, {
              upsert: false,
              cacheControl: '3600',
              contentType: file.type
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('request-media')
            .getPublicUrl(`${requestId}/${fileName}`);

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

      onUpdate([...files, ...newMediaUrls]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Помилка при завантаженні файлів');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileUrl: string, index: number) => {
    try {
      const pathParts = new URL(fileUrl).pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      if (!fileName) return;

      const { error } = await supabase.storage
        .from('request-media')
        .remove([`${requestId}/${fileName}`]);

      if (error) throw error;

      const newFiles = files.filter((_, i) => i !== index);
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
          className="text-blue-500 hover:text-blue-600"
        >
          <Plus size={16} className="mr-1" />
          Додати файл
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

      <div className="grid grid-cols-2 gap-4">
        {files.map((file, index) => (
          <div
            key={file.url}
            className="relative group rounded-lg overflow-hidden bg-tg-theme-button/50"
          >
            {file.type === 'image' ? (
              <div className="aspect-video relative">
                <Image
                  src={file.url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <span className="text-2xl">
                  {file.type === 'video' ? '🎥' : '📄'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-blue-500"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Download size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-red-500"
                onClick={() => handleDelete(file.url, index)}
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