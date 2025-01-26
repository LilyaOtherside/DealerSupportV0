'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { supabase } from '@/lib/supabase';

type Priority = 'low' | 'medium' | 'high';

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          title,
          description,
          priority,
          status: 'new',
          media_urls: []
        });

      if (error) throw error;
      router.push('/requests');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Помилка при створенні запиту. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
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