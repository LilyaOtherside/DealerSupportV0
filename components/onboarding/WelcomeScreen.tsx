'use client';

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">
        Ласкаво просимо до Dealer Support
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Ми допоможемо вам налаштувати ваш профіль для найкращого досвіду роботи
      </p>
      <button
        onClick={onNext}
        className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Почати
      </button>
    </div>
  );
} 