'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, Plus, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'document';
  name: string;
}

interface MediaFilesProps {
  files: MediaFile[];
  requestId: string;
  onUpdate: (newFiles: MediaFile[]) => void;
}

// Функція для транслітерації кирилиці та очищення імені файлу
const sanitizeFileName = (fileName: string): string => {
  const translitMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e',
    'є': 'ie', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'i',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E',
    'Є': 'Ie', 'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'I',
    'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Iu', 'Я': 'Ia'
  };
  
  // Транслітеруємо кирилицю
  const transliterated = fileName
    .split('')
    .map(char => translitMap[char] || char)
    .join('');
  
  // Замінюємо пробіли та інші небезпечні символи
  return transliterated
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
};

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
          const fileExt = file.name.split('.').pop() || '';
          const cleanName = sanitizeFileName(file.name.replace(`.${fileExt}`, ''));
          const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
          const filePath = `${requestId}/${fileName}`;

          console.log('Uploading file:', { filePath, originalName: file.name });

          const { error: uploadError } = await supabase.storage
            .from('request-media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('request-media')
            .getPublicUrl(filePath);

          const fileType: MediaFile['type'] = 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name) ? 'image' :
            /\.(mp4|webm|mov)$/i.test(file.name) ? 'video' :
            'document';

          return {
            url: publicUrl,
            type: fileType,
            name: fileName
          };
        })
      );

      const updatedFiles = [...files, ...newMediaUrls];
      
      console.log('Updating database with files:', updatedFiles);

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
      
      const filePath = `${requestId}/${files[index].name}`;
      
      console.log('Deleting file:', filePath);
      
      const { error: deleteError } = await supabase.storage
        .from('request-media')
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        throw deleteError;
      }

      const newFiles = files.filter((_, i) => i !== index);
      
      console.log('Updating database after deletion:', newFiles);

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