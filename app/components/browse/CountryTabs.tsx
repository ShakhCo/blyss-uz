'use client';

interface CountryTabsProps {
  countries: string[];
  activeCountry: string;
  onSelect: (country: string) => void;
}

export function CountryTabs({
  countries,
  activeCountry,
  onSelect,
}: CountryTabsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex flex-wrap gap-2">
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => onSelect(country)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCountry === country
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {country}
          </button>
        ))}
      </div>
    </div>
  );
}
