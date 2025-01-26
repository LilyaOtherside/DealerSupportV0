'use client';

import { useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type OnboardingStep = 'city' | 'dealer';

export default function OnboardingPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('city');
  const [selectedCity, setSelectedCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cities = [
    { id: 'kyiv', name: 'Київ', icon: '🏢' },
    { id: 'kharkiv', name: 'Харків', icon: '🏢' },
    { id: 'dnipro', name: 'Дніпро', icon: '🏢' },
    { id: 'odesa', name: 'Одеса', icon: '🏢' },
    { id: 'lviv', name: 'Львів', icon: '🏢' },
    { id: 'zaporizhzhia', name: 'Запоріжжя', icon: '🏢' }
  ];

  const dealerCenters = {
    'Київ': [
      { id: 'kyiv-1', name: 'Автоцентр на Столичному', icon: '🏪' },
      { id: 'kyiv-2', name: 'Автосалон на Петрівці', icon: '🏪' }
    ],
    'Харків': [
      { id: 'kharkiv-1', name: 'Автоцентр на Гагаріна', icon: '🏪' },
      { id: 'kharkiv-2', name: 'Автосалон на Героїв Праці', icon: '🏪' }
    ],
    'Дніпро': [
      { id: 'dnipro-1', name: 'Автоцентр на Набережній', icon: '🏪' },
      { id: 'dnipro-2', name: 'Автосалон на Слобожанському', icon: '🏪' }
    ],
    'Одеса': [
      { id: 'odesa-1', name: 'Автоцентр на Таїрова', icon: '🏪' },
      { id: 'odesa-2', name: 'Автосалон в Аркадії', icon: '🏪' }
    ],
    'Львів': [
      { id: 'lviv-1', name: 'Автоцентр на Шевченка', icon: '🏪' },
      { id: 'lviv-2', name: 'Автосалон на Франка', icon: '🏪' }
    ],
    'Запоріжжя': [
      { id: 'zaporizhzhia-1', name: 'Автоцентр на Перемоги', icon: '🏪' },
      { id: 'zaporizhzhia-2', name: 'Автосалон на Соборному', icon: '🏪' }
    ]
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCurrentStep('dealer');
  };

  const handleDealerSelect = async (dealer: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          city: selectedCity,
          dealer_center: dealer,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      router.push('/requests');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Помилка при збереженні даних. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isSubmitting) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-tg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-theme-bg text-white">
      {/* Верхня панель */}
      <div className="bg-tg-theme-section p-4 flex justify-between items-center safe-top">
        <div className="text-lg font-medium">
          {currentStep === 'city' ? 'Вибір міста' : 'Вибір центру'}
        </div>
        <div className="text-sm text-tg-theme-hint">
          {currentStep === 'city' ? '1/2' : '2/2'}
        </div>
      </div>

      {/* Основний контент */}
      <div className="p-4">
        {currentStep === 'city' ? (
          <div>
            <h2 className="text-xl mb-2">Оберіть місто</h2>
            <p className="text-tg-theme-hint mb-6">Виберіть ваше місто для продовження</p>
            <div className="space-y-3">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city.name)}
                  className="tg-button"
                >
                  <div className="flex items-center gap-3">
                    <div className="tg-icon-container">
                      {city.icon}
                    </div>
                    <span>{city.name}</span>
                  </div>
                  <div className="text-tg-theme-hint">→</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl mb-2">Оберіть центр</h2>
            <p className="text-tg-theme-hint mb-6">Виберіть ваш дилерський центр</p>
            <div className="space-y-3">
              {dealerCenters[selectedCity as keyof typeof dealerCenters].map((dealer) => (
                <button
                  key={dealer.id}
                  onClick={() => handleDealerSelect(dealer.name)}
                  className="tg-button"
                >
                  <div className="flex items-center gap-3">
                    <div className="tg-icon-container">
                      {dealer.icon}
                    </div>
                    <span>{dealer.name}</span>
                  </div>
                  <div className="text-tg-theme-hint">→</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Нижня навігація */}
      <div className="fixed bottom-0 left-0 right-0 bg-tg-theme-section p-4 flex justify-around safe-bottom">
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">🏠</span>
        </button>
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">⚡</span>
        </button>
        <button className="p-2 rounded-full bg-tg-theme-button">
          <span className="text-xl">⚙️</span>
        </button>
      </div>
    </div>
  );
} 