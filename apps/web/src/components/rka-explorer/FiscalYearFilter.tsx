'use client';

import { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface FiscalYearFilterProps {
  value: string;
  onChange: (value: string) => void;
  fiscalYears: string[];
}

export function FiscalYearFilter({ value, onChange, fiscalYears }: FiscalYearFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'all', label: 'All Fiscal Years' },
    ...fiscalYears.map((year) => ({ value: year, label: year })),
  ];

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-indigo-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="h-4 w-4" aria-hidden="true" />
        {selectedOption?.label || 'Fiscal Year'}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-600">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                className={`block w-full px-4 py-2 text-left text-sm ${
                  value === option.value
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
