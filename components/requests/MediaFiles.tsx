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
      const pathMatch = fileUrl.match(/request-media\/([^?]+)/);
      if (!pathMatch) return;
      
      const filePath = decodeURIComponent(pathMatch[1]);
      
      const { error: deleteError } = await supabase.storage
        .from('request-media')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const newFiles = files.filter((_, i) => i !== index);
      
      const { error: updateError } = await supabase
        .from('requests')
        .update({ media_urls: newFiles })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
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

      <div className="grid grid-cols-2 gap-4">
        {files.map((file, index) => (
          <div
            key={file.url + index}
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
                className="text-white hover:text-red-500"
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