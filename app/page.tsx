import TelegramAuth from '@/components/TelegramAuth';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <TelegramAuth />
      <OnboardingLayout />
    </main>
  );
} 