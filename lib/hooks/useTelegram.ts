'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/app/types';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initTelegram = async () => {
      if (typeof window !== 'undefined') {
        const telegram = window.Telegram?.WebApp;
        if (telegram) {
          const tgUser = telegram.initDataUnsafe?.user as TelegramUser;
          
          if (tgUser) {
            // Перевіряємо чи існує користувач
            const { data: existingUser } = await supabase
              .from('users')
              .select()
              .eq('telegram_id', tgUser.id.toString())
              .single();

            if (existingUser) {
              setUser(existingUser as User);
            } else {
              // Створюємо нового користувача
              const { data: newUser } = await supabase
                .from('users')
                .insert({
                  telegram_id: tgUser.id.toString(),
                  name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
                  photo_url: tgUser.photo_url,
                  role: 'dealer'
                })
                .select()
                .single();

              if (newUser) {
                setUser(newUser as User);
              }
            }
          }
        }
      }
      setLoading(false);
    };

    initTelegram();
  }, []);

  return { user, loading };
} 