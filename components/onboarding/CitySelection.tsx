'use client';

interface CitySelectionProps {
  onNext: (city: string) => void;
}

const CITIES = [
  'Київ',
  'Харків',
  'Одеса',
  'Дніпро',
  'Львів',
  'Запоріжжя'
];

export default function CitySelection({ onNext }: CitySelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6">Оберіть ваше місто</h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {CITIES.map((city) => (
          <button
            key={city}
            onClick={() => onNext(city)}
            className="bg-white border-2 border-gray-200 p-4 rounded-lg hover:border-blue-500 transition-colors"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
} 