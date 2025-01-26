'use client';

import { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import CitySelection from './CitySelection';
import DealerCenterSelection from './DealerCenterSelection';

export type OnboardingStep = 'welcome' | 'city' | 'dealer-center' | 'completed';

export default function OnboardingLayout() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [userData, setUserData] = useState({
    city: '',
    dealerCenter: ''
  });

  const handleNext = (step: OnboardingStep, data?: any) => {
    if (data) {
      setUserData(prev => ({ ...prev, ...data }));
    }
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-white">
      {currentStep === 'welcome' && (
        <WelcomeScreen onNext={() => handleNext('city')} />
      )}
      {currentStep === 'city' && (
        <CitySelection 
          onNext={(city) => handleNext('dealer-center', { city })} 
        />
      )}
      {currentStep === 'dealer-center' && (
        <DealerCenterSelection 
          city={userData.city}
          onNext={(dealerCenter) => handleNext('completed', { dealerCenter })} 
        />
      )}
    </div>
  );
} 