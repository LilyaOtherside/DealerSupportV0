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
    'Київ',
    'Харків',
    'Дніпро',
    'Одеса',
    'Львів',
    'Запоріжжя'
  ];

  const dealerCenters = {
    'Київ': ['Автоцентр на Столичному', 'Автосалон на Петрівці'],
    'Харків': ['Автоцентр на Гагаріна', 'Автосалон на Героїв Праці'],
    'Дніпро': ['Автоцентр на Набережній', 'Автосалон на Слобожанському'],
    'Одеса': ['Автоцентр на Таїрова', 'Автосалон в Аркадії'],
    'Львів': ['Автоцентр на Шевченка', 'Автосалон на Франка'],
    'Запоріжжя': ['Автоцентр на Перемоги', 'Автосалон на Соборному']
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
      <div className="flex justify-center items-center min-h-screen bg-[#0F0F0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Верхня панель */}
      <div className="bg-[#1C1C1C] p-4 flex justify-between items-center">
        <div className="text-lg font-medium">
          {currentStep === 'city' ? 'Вибір міста' : 'Вибір центру'}
        </div>
        <div className="text-sm text-gray-400">
          {currentStep === 'city' ? '1/2' : '2/2'}
        </div>
      </div>

      {/* Основний контент */}
      <div className="p-4">
        {currentStep === 'city' ? (
          <div>
            <h2 className="text-xl mb-2">Limited Quest</h2>
            <p className="text-gray-400 mb-6">Оберіть ваше місто для продовження</p>
            <div className="space-y-3">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="w-full p-4 bg-[#1C1C1C] rounded-xl flex items-center justify-between hover:bg-[#252525] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2C2C2C] rounded-full flex items-center justify-center">
                      🏢
                    </div>
                    <span>{city}</span>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl mb-2">Share Story</h2>
            <p className="text-gray-400 mb-6">Оберіть дилерський центр</p>
            <div className="space-y-3">
              {dealerCenters[selectedCity as keyof typeof dealerCenters].map((dealer) => (
                <button
                  key={dealer}
                  onClick={() => handleDealerSelect(dealer)}
                  className="w-full p-4 bg-[#1C1C1C] rounded-xl flex items-center justify-between hover:bg-[#252525] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2C2C2C] rounded-full flex items-center justify-center">
                      🏪
                    </div>
                    <span>{dealer}</span>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Нижня навігація */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1C1C1C] p-4 flex justify-around">
        <button className="p-2 rounded-full bg-[#2C2C2C]">
          <span className="text-xl">🏠</span>
        </button>
        <button className="p-2 rounded-full bg-[#2C2C2C]">
          <span className="text-xl">⚡</span>
        </button>
        <button className="p-2 rounded-full bg-[#2C2C2C]">
          <span className="text-xl">⚙️</span>
        </button>
      </div>
    </div>
  );
} 