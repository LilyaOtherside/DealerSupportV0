'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TelegramAuth(): JSX.Element {
  const [isTelegramApp, setIsTelegramApp] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const telegram = window.Telegram?.WebApp;
      if (telegram) {
        setIsTelegramApp(true);
        telegram.expand(); // Включаємо Full Screen Mode
      }
    }
  }, []);

  if (!isTelegramApp) {
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

  return <div></div>;
} 