'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/lib/hooks/useTelegram';

export default function TelegramAuth() {
  const { user, loading } = useTelegram();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (!user.city || !user.dealer_center) {
        router.push('/onboarding');
      } else {
        router.push('/requests');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">
          Будь ласка, відкрийте додаток через Telegram
        </h1>
        <p className="text-gray-600">
          Цей додаток доступний тільки через Telegram Mini App
        </p>
      </div>
    );
  }

  return <div className="telegram-app-container"></div>;
} 