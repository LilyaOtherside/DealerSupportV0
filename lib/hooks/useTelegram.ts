'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/app/types';

export function useTelegram() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTelegramApp, setIsTelegramApp] = useState(false);

  useEffect(() => {
    const initTelegram = async () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const webapp = window.Telegram.WebApp;
        
        // Повідомляємо Telegram що додаток готовий
        webapp.ready();
        // Розгортаємо на весь екран
        webapp.expand();
        
        setIsTelegramApp(true);

        const tgUser = webapp.initDataUnsafe?.user;
        if (tgUser) {
          try {
            // Перевіряємо чи існує користувач
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select()
              .eq('telegram_id', tgUser.id.toString())
              .single();

            if (fetchError && fetchError.code === 'PGRST116') {
              // Користувача не знайдено, створюємо нового
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                  telegram_id: tgUser.id.toString(),
                  name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
                  photo_url: tgUser.photo_url,
                  role: 'dealer'
                })
                .select()
                .single();

              if (!insertError && newUser) {
                setUser(newUser as User);
              }
            } else if (existingUser) {
              setUser(existingUser as User);
            }
          } catch (error) {
            console.error('Error initializing user:', error);
          }
        }
      }
      setLoading(false);
    };

    initTelegram();
  }, []);

  return { user, loading, isTelegramApp };
} 