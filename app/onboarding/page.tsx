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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {currentStep === 'city' ? (
        <div>
          <h1 className="text-2xl font-bold mb-6">Оберіть ваше місто</h1>
          <div className="grid grid-cols-2 gap-4">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-6">Оберіть дилерський центр</h1>
          <div className="flex flex-col gap-4">
            {dealerCenters[selectedCity as keyof typeof dealerCenters].map((dealer) => (
              <button
                key={dealer}
                onClick={() => handleDealerSelect(dealer)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
              >
                {dealer}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 